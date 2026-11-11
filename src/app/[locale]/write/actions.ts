"use server";

import { compileMDX } from "next-mdx-remote/rsc";
import { mdxComponents } from "@/components/posts/mdxComponents";
import { mdxOptions } from "@/lib/mdx";
import { requireOwner } from "@/lib/write/session";
import { WriteError, commitChanges, createImageBlob, deletePost, type CommitChange } from "@/lib/write/github";
import { IMAGES_DIR, SLUG_PATTERN, postPath, serializePost, type PostFields } from "@/lib/write/post";

const AUTH_MESSAGE = "로그인이 끝났어요. 내용은 이 기기에 보관돼 있으니 다시 로그인한 뒤 저장해 주세요.";

// 미리보기: 글 상세 페이지와 같은 MDX 설정과 컴포넌트로 그린다.
export async function previewAction(source: string) {
  await requireOwner();
  try {
    const { content } = await compileMDX({ source, components: mdxComponents, options: mdxOptions });
    return { ok: true as const, content };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false as const, error: message.split("\n").slice(0, 3).join("\n") };
  }
}

export async function uploadImageAction(base64: string) {
  const { token } = await requireOwner();
  // 줄인 사진 한 장이 이 크기를 넘으면 무언가 잘못된 것이다.
  if (base64.length > 4 * 1024 * 1024) return { ok: false as const, error: "사진이 너무 커요. 다른 사진으로 시도해 주세요." };
  try {
    return { ok: true as const, sha: await createImageBlob(token, base64) };
  } catch (error) {
    if (error instanceof WriteError && error.message === "AUTH") return { ok: false as const, error: AUTH_MESSAGE };
    return { ok: false as const, error: error instanceof Error ? error.message : "사진을 올리지 못했어요." };
  }
}

export type SaveInput = {
  mode: "draft" | "publish";
  slug: string;
  fields: PostFields;
  body: string;
  originalPath: string | null;
  originalSha: string | null;
  // 이 글에서 새로 넣은 사진: 파일 이름과 미리 올려 둔 blob sha
  images: { filename: string; sha: string }[];
};

export type SaveResult =
  | { ok: true; path: string; sha: string | null; commitUrl: string; postUrl: string | null; message: string }
  | { ok: false; error: string; reason?: "conflict" | "slug" | "invalid" | "auth" };

export async function saveAction(input: SaveInput): Promise<SaveResult> {
  let token: string;
  try {
    ({ token } = await requireOwner());
  } catch {
    return { ok: false, reason: "auth", error: AUTH_MESSAGE };
  }

  const { slug, fields } = input;
  if (!SLUG_PATTERN.test(slug)) {
    return { ok: false, reason: "invalid", error: "주소는 영문 소문자, 숫자, 하이픈(-)만 쓸 수 있어요." };
  }
  if (!fields.title.trim()) return { ok: false, reason: "invalid", error: "제목을 입력해 주세요." };
  if (input.mode === "publish") {
    if (!fields.summary.trim()) return { ok: false, reason: "invalid", error: "발행하려면 요약을 입력해 주세요." };
    const compiled = await previewAction(input.body);
    if (!compiled.ok) return { ok: false, reason: "invalid", error: `본문에 MDX 오류가 있어 발행할 수 없어요. ${compiled.error}` };
  }

  const wasPublished = !!input.originalPath && !input.originalPath.includes("/drafts/");
  // 발행된 글을 임시저장하면 공개 글이 내려가므로 막는다.
  if (wasPublished && input.mode === "draft") {
    return { ok: false, reason: "invalid", error: "이미 발행된 글은 임시저장할 수 없어요. 수정 내용을 발행해 주세요." };
  }

  const draft = input.mode === "draft";
  const targetPath = postPath(slug, draft);
  const changes: CommitChange[] = [{ path: targetPath, content: serializePost(fields, input.body) }];
  if (input.originalPath && input.originalPath !== targetPath) {
    changes.push({ path: input.originalPath, delete: true });
  }
  for (const image of input.images) {
    if (!/^[a-z0-9][a-z0-9-]*\.(jpg|jpeg|png|webp|gif)$/.test(image.filename)) continue;
    // 본문에서 지운 사진은 올리지 않는다.
    if (!input.body.includes(`/img/posts/${slug}/${image.filename}`)) continue;
    changes.push({ path: `${IMAGES_DIR}/${slug}/${image.filename}`, blobSha: image.sha });
  }

  const verb = draft ? "임시저장" : wasPublished ? "글 수정" : "글 추가";
  const message = `docs: ${fields.title.trim()} ${verb}\n\n/write 편집기에서 저장`;

  try {
    const result = await commitChanges(token, message, changes, {
      originalPath: input.originalPath,
      originalSha: input.originalSha,
      targetPath,
    });
    return {
      ok: true,
      path: targetPath,
      sha: result.savedSha,
      commitUrl: result.commitUrl,
      postUrl: draft ? null : `/posts/${slug}`,
      message: verb,
    };
  } catch (error) {
    if (error instanceof WriteError && error.message === "AUTH") return { ok: false, reason: "auth", error: AUTH_MESSAGE };
    if (error instanceof WriteError && error.message === "CONFLICT") {
      return {
        ok: false,
        reason: "conflict",
        error: "이 글을 연 뒤 저장소에서 같은 글이 바뀌었어요. 덮어쓰지 않고 멈췄어요. 지금 내용은 이 기기에 보관돼 있으니 최신 내용을 불러온 뒤 다시 저장해 주세요.",
      };
    }
    if (error instanceof WriteError && error.message === "SLUG_TAKEN") {
      return { ok: false, reason: "slug", error: "같은 주소의 글이 이미 있어요. 주소를 바꿔 주세요." };
    }
    return { ok: false, error: error instanceof Error ? error.message : "저장하지 못했어요." };
  }
}

export type DeleteResult =
  | { ok: true; commitUrl: string; deleted: string[] }
  | { ok: false; error: string; reason?: "conflict" | "auth" };

// 글과 그 글의 사진을 저장소에서 지운다. 편집을 시작할 때 읽은 sha와 다르면 멈춘다.
export async function deleteAction(input: { path: string; sha: string; title: string }): Promise<DeleteResult> {
  let token: string;
  try {
    ({ token } = await requireOwner());
  } catch {
    return { ok: false, reason: "auth", error: AUTH_MESSAGE };
  }

  const slug = input.path.split("/").pop()?.replace(/\.mdx$/, "") ?? "";
  const valid = SLUG_PATTERN.test(slug) && (input.path === postPath(slug, false) || input.path === postPath(slug, true));
  if (!valid || !input.sha) return { ok: false, error: "지울 글을 찾지 못했어요." };

  const message = `docs: ${input.title.trim() || slug} 삭제\n\n/write 편집기에서 삭제`;
  try {
    const result = await deletePost(token, input.path, input.sha, message);
    return { ok: true, ...result };
  } catch (error) {
    if (error instanceof WriteError && error.message === "AUTH") return { ok: false, reason: "auth", error: AUTH_MESSAGE };
    if (error instanceof WriteError && error.message === "CONFLICT") {
      return {
        ok: false,
        reason: "conflict",
        error: "이 글을 연 뒤 저장소에서 글이 바뀌었거나 이미 지워졌어요. 지우지 않고 멈췄어요. 최신 내용을 불러온 뒤 다시 확인해 주세요.",
      };
    }
    return { ok: false, error: error instanceof Error ? error.message : "삭제하지 못했어요." };
  }
}
