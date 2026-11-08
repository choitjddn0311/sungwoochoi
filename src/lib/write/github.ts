import matter from "gray-matter";
import { writeConfig } from "@/lib/write/session";
import { DRAFTS_DIR, POSTS_DIR, type PostFields } from "@/lib/write/post";

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

async function postFiles(gh: Fetcher, treeSha: string) {
  const tree = await gh<{ tree: TreeItem[] }>(`/git/trees/${treeSha}?recursive=1`);
  const isPost = (item: TreeItem, dir: string) =>
    item.type === "blob" && item.path.startsWith(`${dir}/`) && item.path.endsWith(".mdx") && !item.path.slice(dir.length + 1).includes("/");
  return tree.tree.filter((item) => isPost(item, POSTS_DIR) || isPost(item, DRAFTS_DIR));
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

  const newTree = await gh<{ sha: string }>("/git/trees", {
    method: "POST",
    body: JSON.stringify({ base_tree: treeSha, tree }),
  });
  const commit = await gh<{ sha: string; html_url: string }>("/git/commits", {
    method: "POST",
    body: JSON.stringify({ message, tree: newTree.sha, parents: [commitSha] }),
  });

  try {
    await gh(`/git/refs/heads/${writeConfig.branch}`, {
      method: "PATCH",
      body: JSON.stringify({ sha: commit.sha, force: false }),
    });
  } catch (error) {
    // 그 사이에 다른 커밋이 올라와 앞으로 감기가 안 되는 경우
    if ((error as { status?: number }).status === 422) throw new WriteError("CONFLICT");
    throw error;
  }

  const blobs = await gh<{ tree: TreeItem[] }>(`/git/trees/${newTree.sha}?recursive=1`);
  const saved = blobs.tree.find((item) => item.path === guard.targetPath);
  return { commitSha: commit.sha, commitUrl: commit.html_url, savedSha: saved?.sha ?? null };
}
