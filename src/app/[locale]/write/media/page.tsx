import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import type { Photo, Video } from "@/lib/work";
import { getOwnerSession } from "@/lib/write/session";
import { WriteError, readRepoFiles } from "@/lib/write/github";
import { PHOTOS_PATH, PHOTO_DIR, REEL_DIR, VIDEOS_PATH } from "@/lib/write/media";
import MediaManager, { type MediaInitial } from "@/components/write/MediaManager";

// /write와 같다: 로그인한 주인에게만 보이고, 검색에는 나오지 않는다.
export async function generateMetadata(): Promise<Metadata> {
  if (!(await getOwnerSession())) return {};
  return { title: "Media", robots: { index: false, follow: false } };
}

export default async function MediaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getOwnerSession();
  if (locale !== "ko" || !session) notFound();

  let initial: MediaInitial | null = null;
  let error: string | null = null;
  let authExpired = false;
  try {
    // 배포본이 아니라 저장소 최신 상태를 읽는다.
    const { files, listed } = await readRepoFiles(session.token, [PHOTOS_PATH, VIDEOS_PATH], [PHOTO_DIR, REEL_DIR]);
    const [photosFile, videosFile] = files;
    initial = {
      photos: photosFile ? (JSON.parse(photosFile.content) as Photo[]) : [],
      videos: videosFile ? (JSON.parse(videosFile.content) as Video[]) : [],
      base: { photos: photosFile?.sha ?? null, videos: videosFile?.sha ?? null },
      existing: listed,
    };
  } catch (e) {
    if (e instanceof WriteError && e.message === "AUTH") authExpired = true;
    else error = e instanceof Error ? e.message : "사진·영상 목록을 불러오지 못했어요.";
  }

  return <MediaManager initial={initial} error={error} authExpired={authExpired} login={session.login} />;
}
