import matter from "gray-matter";
import { writeConfig } from "@/lib/write/session";
import { DRAFTS_DIR, IMAGES_DIR, POSTS_DIR, type PostFields } from "@/lib/write/post";

// GitHub REST API를 직접 호출한다. 글 하나를 저장할 때 커밋 하나만 만든다.

export class WriteError extends Error {}

type Fetcher = <T>(path: string, init?: RequestInit) => Promise<T>;

function client(token: string): Fetcher {
  return async (path, init) => {
    const response = await fetch(`https://api.github.com/repos/${writeConfig.repo}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
      },
    });
    // 쿠키에 든 토큰이 GitHub에서 무효가 된 경우(권한 취소, 오래된 토큰 폐기 등)
    if (response.status === 401) throw new WriteError("AUTH");
    if (!response.ok) {
      const detail = await response.text();
      const error = new WriteError(`GitHub 요청 실패 (${response.status}): ${detail.slice(0, 200)}`);
      (error as WriteError & { status: number }).status = response.status;
      throw error;
    }
    return (await response.json()) as never;
  };
}

type TreeItem = { path: string; type: string; sha: string };

export type StoredPost = PostFields & {
  slug: string;
  draft: boolean;
  path: string;
  sha: string;
};

async function headCommit(gh: Fetcher) {
  const ref = await gh<{ object: { sha: string } }>(`/git/ref/heads/${writeConfig.branch}`);
  const commit = await gh<{ tree: { sha: string } }>(`/git/commits/${ref.object.sha}`);
  return { commitSha: ref.object.sha, treeSha: commit.tree.sha };
}

async function repoTree(gh: Fetcher, treeSha: string) {
  return (await gh<{ tree: TreeItem[] }>(`/git/trees/${treeSha}?recursive=1`)).tree;
}

function onlyPosts(items: TreeItem[]) {
  const isPost = (item: TreeItem, dir: string) =>
    item.type === "blob" && item.path.startsWith(`${dir}/`) && item.path.endsWith(".mdx") && !item.path.slice(dir.length + 1).includes("/");
  return items.filter((item) => isPost(item, POSTS_DIR) || isPost(item, DRAFTS_DIR));
}

async function postFiles(gh: Fetcher, treeSha: string) {
  return onlyPosts(await repoTree(gh, treeSha));
}

async function readBlob(gh: Fetcher, sha: string) {
  const blob = await gh<{ content: string }>(`/git/blobs/${sha}`);
  return Buffer.from(blob.content, "base64").toString("utf-8");
}

function toStored(item: TreeItem, source: string): StoredPost & { body: string } {
  const { data, content } = matter(source);
  const draft = item.path.startsWith(`${DRAFTS_DIR}/`);
  return {
    slug: item.path.split("/").pop()!.replace(/\.mdx$/, ""),
    draft,
    path: item.path,
    sha: item.sha,
    title: String(data.title ?? ""),
    date: data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date ?? ""),
    summary: String(data.summary ?? ""),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    body: content,
  };
}

// 배포본이 아니라 저장소 최신 상태의 글 목록
export async function listStoredPosts(token: string): Promise<StoredPost[]> {
  const gh = client(token);
  const { treeSha } = await headCommit(gh);
  const files = await postFiles(gh, treeSha);
  const posts = await Promise.all(
    files.map(async (item) => {
      const { body: _body, ...meta } = toStored(item, await readBlob(gh, item.sha));
      void _body;
      return meta;
    }),
  );
  return posts.sort((a, b) => Number(b.draft) - Number(a.draft) || (a.date > b.date ? -1 : 1));
}

export async function loadStoredPost(token: string, path: string) {
  const gh = client(token);
  const { treeSha } = await headCommit(gh);
  const item = (await postFiles(gh, treeSha)).find((file) => file.path === path);
  if (!item) return null;
  return toStored(item, await readBlob(gh, item.sha));
}

// 사진은 고르는 즉시 blob으로 올려 두고, 저장할 때 커밋에 넣는다.
// 요청 하나의 크기를 작게 유지하기 위해서다(Vercel 요청 크기 제한 4.5MB).
export async function createImageBlob(token: string, base64: string) {
  const gh = client(token);
  const blob = await gh<{ sha: string }>("/git/blobs", {
    method: "POST",
    body: JSON.stringify({ content: base64, encoding: "base64" }),
  });
  return blob.sha;
}

export type CommitChange =
  | { path: string; content: string }
  | { path: string; blobSha: string }
  | { path: string; delete: true };

export type CommitGuard = {
  // 편집을 시작할 때 읽은 파일과 그 sha. 새 글이면 null.
  originalPath: string | null;
  originalSha: string | null;
  // 새로 쓸 경로에 다른 글이 있으면 안 된다.
  targetPath: string;
};

export async function commitChanges(token: string, message: string, changes: CommitChange[], guard: CommitGuard) {
  const gh = client(token);
  const { commitSha, treeSha } = await headCommit(gh);
  const files = await postFiles(gh, treeSha);
  const current = (path: string) => files.find((file) => file.path === path);

  if (guard.originalPath) {
    const now = current(guard.originalPath);
    if (!now || now.sha !== guard.originalSha) {
      throw new WriteError("CONFLICT");
    }
  }
  if (guard.targetPath !== guard.originalPath && current(guard.targetPath)) {
    throw new WriteError("SLUG_TAKEN");
  }

  const tree = await Promise.all(
    changes.map(async (change) => {
      if ("delete" in change) return { path: change.path, mode: "100644", type: "blob", sha: null };
      if ("blobSha" in change) return { path: change.path, mode: "100644", type: "blob", sha: change.blobSha };
      const blob = await gh<{ sha: string }>("/git/blobs", {
        method: "POST",
        body: JSON.stringify({ content: change.content, encoding: "utf-8" }),
      });
      return { path: change.path, mode: "100644", type: "blob", sha: blob.sha };
    }),
  );

  const { commitUrl, treeSha: newTreeSha, commitSha: newCommitSha } = await writeCommit(gh, commitSha, treeSha, tree, message);
  const saved = (await repoTree(gh, newTreeSha)).find((item) => item.path === guard.targetPath);
  return { commitSha: newCommitSha, commitUrl, savedSha: saved?.sha ?? null };
}

type TreeEntry = { path: string; mode: string; type: string; sha: string | null };

export type RepoFile = { path: string; sha: string; content: string };

/** 저장소 최신 상태에서 파일들의 내용과 sha, 그리고 폴더 안 파일 목록을 읽는다. */
export async function readRepoFiles(token: string, paths: string[], dirs: string[] = []) {
  const gh = client(token);
  const { treeSha } = await headCommit(gh);
  const items = await repoTree(gh, treeSha);
  const files = await Promise.all(
    paths.map(async (path): Promise<RepoFile | null> => {
      const item = items.find((entry) => entry.type === "blob" && entry.path === path);
      return item ? { path, sha: item.sha, content: await readBlob(gh, item.sha) } : null;
    }),
  );
  const listed = items.filter((entry) => entry.type === "blob" && dirs.some((dir) => entry.path.startsWith(`${dir}/`))).map((entry) => entry.path);
  return { files, listed };
}

/**
 * 여러 파일을 커밋 하나로 바꾼다. expected에 적은 파일이 편집을 시작할 때와 달라졌으면 CONFLICT.
 * (sha가 null이면 그 파일이 아직 없어야 한다)
 */
export async function commitRepoChanges(
  token: string,
  message: string,
  changes: CommitChange[],
  expected: { path: string; sha: string | null }[],
) {
  const gh = client(token);
  const { commitSha, treeSha } = await headCommit(gh);
  const items = await repoTree(gh, treeSha);
  for (const { path, sha } of expected) {
    const now = items.find((entry) => entry.type === "blob" && entry.path === path)?.sha ?? null;
    if (now !== sha) throw new WriteError("CONFLICT");
  }
  const tree = await Promise.all(
    changes.map(async (change) => {
      if ("delete" in change) return { path: change.path, mode: "100644", type: "blob", sha: null };
      if ("blobSha" in change) return { path: change.path, mode: "100644", type: "blob", sha: change.blobSha };
      const blob = await gh<{ sha: string }>("/git/blobs", {
        method: "POST",
        body: JSON.stringify({ content: change.content, encoding: "utf-8" }),
      });
      return { path: change.path, mode: "100644", type: "blob", sha: blob.sha };
    }),
  );
  const { commitUrl, treeSha: newTreeSha } = await writeCommit(gh, commitSha, treeSha, tree, message);
  const after = await repoTree(gh, newTreeSha);
  const shaOf = (path: string) => after.find((entry) => entry.path === path)?.sha ?? null;
  return { commitUrl, shaOf };
}

// 트리를 만들고 커밋한 뒤 브랜치를 앞으로 감는다. 그 사이 다른 커밋이 올라왔으면 CONFLICT.
async function writeCommit(gh: Fetcher, parentSha: string, baseTreeSha: string, tree: TreeEntry[], message: string) {
  const newTree = await gh<{ sha: string }>("/git/trees", {
    method: "POST",
    body: JSON.stringify({ base_tree: baseTreeSha, tree }),
  });
  const commit = await gh<{ sha: string; html_url: string }>("/git/commits", {
    method: "POST",
    body: JSON.stringify({ message, tree: newTree.sha, parents: [parentSha] }),
  });

  try {
    await gh(`/git/refs/heads/${writeConfig.branch}`, {
      method: "PATCH",
      body: JSON.stringify({ sha: commit.sha, force: false }),
    });
  } catch (error) {
    if ((error as { status?: number }).status === 422) throw new WriteError("CONFLICT");
    throw error;
  }
  return { commitSha: commit.sha, commitUrl: commit.html_url, treeSha: newTree.sha };
}

// 글 파일과 그 글의 사진 폴더(public/img/posts/<slug>/)를 커밋 하나로 지운다.
// 같은 주소의 글이 임시저장과 발행 양쪽에 있으면 사진은 다른 쪽이 쓰고 있으니 남긴다.
export async function deletePost(token: string, path: string, sha: string, message: string) {
  const gh = client(token);
  const { commitSha, treeSha } = await headCommit(gh);
  const items = await repoTree(gh, treeSha);
  const posts = onlyPosts(items);

  const target = posts.find((item) => item.path === path);
  if (!target || target.sha !== sha) throw new WriteError("CONFLICT");

  const slug = path.split("/").pop()!.replace(/\.mdx$/, "");
  const sharedSlug = posts.some((item) => item.path !== path && item.path.endsWith(`/${slug}.mdx`));
  const images = sharedSlug
    ? []
    : items.filter((item) => item.type === "blob" && item.path.startsWith(`${IMAGES_DIR}/${slug}/`)).map((item) => item.path);

  const tree = [path, ...images].map((file) => ({ path: file, mode: "100644", type: "blob", sha: null }));
  const { commitUrl } = await writeCommit(gh, commitSha, treeSha, tree, message);
  return { commitUrl, deleted: [path, ...images] };
}
