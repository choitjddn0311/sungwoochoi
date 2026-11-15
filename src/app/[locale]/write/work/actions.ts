"use server";

import type { Photo, Video } from "@/lib/work";
import { requireOwner } from "@/lib/write/session";
import { WriteError, commitRepoChanges, readRepoInfo, type CommitChange } from "@/lib/write/github";
import {
  PHOTOS_PATH,
  VIDEOS_PATH,
  checkPhoto,
  checkVideo,
  cleanPhoto,
  cleanVideo,
  isMediaFile,
  parseYoutubeId,
  publicPath,
  serializeList,
} from "@/lib/write/media";
import {
  PROJECTS_PATH,
  checkProject,
  cleanProject,
  monthOf,
  parseRepo,
  serializeProjects,
  type ProjectEntry,
} from "@/lib/write/projects";

const AUTH_MESSAGE = "로그인이 끝났어요. 다시 로그인한 뒤 저장해 주세요. 바꾼 내용은 이 화면을 닫으면 사라져요.";

/** 유튜브 주소에서 영상 제목을 가져온다. 실패해도 등록은 할 수 있다. */
export async function youtubeInfoAction(url: string): Promise<{ id: string; title: string } | null> {
  await requireOwner();
  const id = parseYoutubeId(url);
  if (!id) return null;
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`,
      { cache: "no-store" },
    );
    if (!response.ok) return { id, title: "" };
    const data = (await response.json()) as { title?: string };
    return { id, title: data.title ?? "" };
  } catch {
    return { id, title: "" };
  }
}

export type RepoImport = { title: string; description: string; start: string; techs: string[]; url: string };

/** GitHub 저장소 정보로 프로젝트 칸을 채운다. 실패하면 null을 돌려주고 직접 입력하게 한다. */
export async function repoInfoAction(url: string): Promise<RepoImport | null> {
  const { token } = await requireOwner();
  const repo = parseRepo(url);
  if (!repo) return null;
  try {
    const info = await readRepoInfo(token, repo.owner, repo.repo);
    return {
      title: info.name,
      description: info.description,
      start: monthOf(info.createdAt),
      techs: info.languages,
      url: /^https:\/\//.test(info.homepage) ? info.homepage : "",
    };
  } catch {
    return null;
  }
}

type Base = { photos: string | null; videos: string | null; projects: string | null };

export type MediaSaveInput = {
  photos: Photo[];
  videos: Video[];
  projects: ProjectEntry[];
  // 새로 올린 파일: 저장소 경로와 미리 올려 둔 blob sha
  added: { path: string; sha: string }[];
  // 편집을 시작할 때 읽은 목록 파일들의 sha
  base: Base;
  // 편집을 시작할 때 저장소에 있던 사진·썸네일 파일
  existing: string[];
};

export type MediaSaveResult =
  | { ok: true; commitUrl: string; base: Base; existing: string[]; summary: string }
  | { ok: false; error: string; reason?: "conflict" | "auth" | "invalid" };

export async function saveMediaAction(input: MediaSaveInput): Promise<MediaSaveResult> {
  let token: string;
  try {
    ({ token } = await requireOwner());
  } catch {
    return { ok: false, reason: "auth", error: AUTH_MESSAGE };
  }

  const photos = input.photos.map(cleanPhoto);
  const videos = input.videos.map(cleanVideo);
  const projects = input.projects.map(cleanProject);
  for (const problem of [...photos.map(checkPhoto), ...videos.map(checkVideo), ...projects.map(checkProject)]) {
    if (problem) return { ok: false, reason: "invalid", error: problem };
  }
  if (input.added.some((file) => !isMediaFile(file.path) || !/^[0-9a-f]{40}$/.test(file.sha))) {
    return { ok: false, reason: "invalid", error: "올린 파일 경로가 올바르지 않아요." };
  }

  // 목록이 쓰는 파일만 남긴다. 새로 올렸지만 목록에서 지운 파일은 커밋하지 않는다.
  const used = new Set([...photos.map((photo) => photo.src), ...videos.flatMap((video) => (video.thumbnail ? [video.thumbnail] : []))]);
  const added = input.added.filter((file) => used.has(publicPath(file.path)));
  const removed = input.existing.filter((path) => isMediaFile(path) && !used.has(publicPath(path)));

  const changes: CommitChange[] = [
    { path: PHOTOS_PATH, content: serializeList(photos) },
    { path: VIDEOS_PATH, content: serializeList(videos) },
    { path: PROJECTS_PATH, content: serializeProjects(projects) },
    ...added.map((file) => ({ path: file.path, blobSha: file.sha })),
    ...removed.map((path) => ({ path, delete: true as const })),
  ];

  const parts = [
    added.length && `파일 ${added.length}개 추가`,
    removed.length && `파일 ${removed.length}개 삭제`,
    `사진 ${photos.length}장, 영상 ${videos.length}개, 프로젝트 ${projects.length}개`,
  ].filter(Boolean);
  const summary = parts.join(", ");
  const message = `docs: 작업물 목록 수정 (${summary})\n\n/write/work 화면에서 저장`;

  try {
    const result = await commitRepoChanges(token, message, changes, [
      { path: PHOTOS_PATH, sha: input.base.photos },
      { path: VIDEOS_PATH, sha: input.base.videos },
      { path: PROJECTS_PATH, sha: input.base.projects },
    ]);
    const kept = input.existing.filter((path) => !removed.includes(path));
    return {
      ok: true,
      commitUrl: result.commitUrl,
      base: { photos: result.shaOf(PHOTOS_PATH), videos: result.shaOf(VIDEOS_PATH), projects: result.shaOf(PROJECTS_PATH) },
      existing: [...kept, ...added.map((file) => file.path)],
      summary,
    };
  } catch (error) {
    if (error instanceof WriteError && error.message === "AUTH") return { ok: false, reason: "auth", error: AUTH_MESSAGE };
    if (error instanceof WriteError && error.message === "CONFLICT") {
      return {
        ok: false,
        reason: "conflict",
        error: "이 화면을 연 뒤 저장소에서 작업물 목록이 바뀌었어요. 덮어쓰지 않고 멈췄어요. 새로 불러온 뒤 다시 바꿔 주세요.",
      };
    }
    return { ok: false, error: error instanceof Error ? error.message : "저장하지 못했어요." };
  }
}
