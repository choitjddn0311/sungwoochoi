// 작품 등록 화면과 서버가 함께 쓰는 규칙. 브라우저에서도 쓰므로 Node 전용 모듈을 넣지 않는다.
import type { Photo, Video } from "@/lib/work";

export const PHOTOS_PATH = "src/data/photos.json";
export const VIDEOS_PATH = "src/data/videos.json";
export const PHOTO_DIR = "public/img/photos";
export const REEL_DIR = "public/img/reels";

/** 작품 사진은 긴 변 2400px로 줄여 올린다. */
export const PHOTO_MAX_SIDE = 2400;
/** 릴스 썸네일은 세로 칸에만 쓰므로 더 작게 */
export const REEL_THUMB_MAX_SIDE = 1600;

const FILE_PATTERN = /^[a-z0-9][a-z0-9-]*\.(jpg|png|webp|gif)$/;

export function publicPath(repoPath: string) {
  return repoPath.replace(/^public/, "");
}

export function isMediaFile(repoPath: string) {
  const [dir, name] = [repoPath.slice(0, repoPath.lastIndexOf("/")), repoPath.split("/").pop() ?? ""];
  return (dir === PHOTO_DIR || dir === REEL_DIR) && FILE_PATTERN.test(name);
}

/** 파일 이름: 날짜와 제목에서 만든 영문 이름. 한글 제목이면 날짜와 짧은 임의 문자를 쓴다. */
export function mediaFilename(date: string, title: string, taken: Set<string>, ext = "jpg") {
  const day = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : new Date().toISOString().slice(0, 10);
  const words = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
  const base = `${day}-${words || Math.random().toString(36).slice(2, 7)}`;
  let name = `${base}.${ext}`;
  for (let n = 2; taken.has(name); n++) name = `${base}-${n}.${ext}`;
  return name;
}

export function parseYoutubeId(url: string): string | null {
  const match = url.trim().match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/))([\w-]{11})/);
  return match ? match[1] : null;
}

export function parseInstagramId(url: string): string | null {
  const match = url.trim().match(/instagram\.com\/(?:[\w.]+\/)?(?:reel|reels|p|tv)\/([\w-]+)/);
  return match ? match[1] : null;
}

export function isInstagramPostUrl(url: string) {
  return /^https:\/\/(www\.)?instagram\.com\/(?:[\w.]+\/)?(p|reel|reels|tv)\/[\w-]+\/?(\?.*)?$/.test(url.trim());
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const text = (value: unknown, max = 200) => typeof value === "string" && value.length <= max;
const optionalText = (value: unknown, max = 200) => value === undefined || text(value, max);

export function checkPhoto(photo: Photo): string | null {
  if (!/^\/img\/photos\/[a-z0-9][a-z0-9-]*\.(jpg|png|webp|gif)$/.test(photo.src)) return "사진 파일 경로가 올바르지 않아요.";
  if (!text(photo.alt, 300) || !photo.alt.trim()) return `사진 설명을 입력해 주세요. (${photo.title || photo.src})`;
  if (!Number.isInteger(photo.width) || !Number.isInteger(photo.height) || photo.width < 1 || photo.height < 1) return "사진 크기 정보가 없어요.";
  if (photo.date !== undefined && !DATE.test(photo.date)) return "날짜는 2026-11-08 형식으로 입력해 주세요.";
  if (photo.instagram !== undefined && !isInstagramPostUrl(photo.instagram)) return "인스타그램 게시물 주소가 올바르지 않아요.";
  for (const key of ["title", "series", "place", "camera", "lens"] as const) {
    if (!optionalText(photo[key])) return "입력한 글이 너무 길어요.";
  }
  return null;
}

export function checkVideo(video: Video): string | null {
  if (video.provider === "youtube" && !/^[\w-]{11}$/.test(video.id)) return "유튜브 영상 주소가 올바르지 않아요.";
  if (video.provider === "instagram") {
    if (!/^[\w-]+$/.test(video.id)) return "릴스 주소가 올바르지 않아요.";
    if (!video.thumbnail || !/^\/img\/reels\/[a-z0-9][a-z0-9-]*\.(jpg|png|webp)$/.test(video.thumbnail)) return `릴스 썸네일을 골라 주세요. (${video.title})`;
  }
  if (!["youtube", "vimeo", "instagram"].includes(video.provider)) return "지원하지 않는 영상이에요.";
  if (!text(video.title) || !video.title.trim()) return "영상 제목을 입력해 주세요.";
  if (video.date !== undefined && !DATE.test(video.date)) return "날짜는 2026-11-08 형식으로 입력해 주세요.";
  if (!optionalText(video.role)) return "입력한 글이 너무 길어요.";
  return null;
}

/** 저장할 때 빈 칸은 지우고, 키 순서를 기존 파일과 같게 맞춘다. */
export function cleanPhoto(photo: Photo): Photo {
  const order: (keyof Photo)[] = ["src", "alt", "width", "height", "title", "series", "date", "place", "camera", "lens", "instagram"];
  return Object.fromEntries(
    order.map((key) => [key, typeof photo[key] === "string" ? (photo[key] as string).trim() : photo[key]]).filter(([, v]) => v !== undefined && v !== ""),
  ) as unknown as Photo;
}

export function cleanVideo(video: Video): Video {
  const order: (keyof Video)[] = ["provider", "id", "title", "date", "role", "thumbnail", "vertical"];
  return Object.fromEntries(
    order
      .map((key) => [key, typeof video[key] === "string" ? (video[key] as string).trim() : video[key]])
      .filter(([, v]) => v !== undefined && v !== "" && v !== false),
  ) as unknown as Video;
}

export function serializeList(list: unknown[]) {
  return `${JSON.stringify(list, null, 2)}\n`;
}
