import photosData from "@/data/photos.json";
import videosData from "@/data/videos.json";
import projectsData from "@/data/projects.json";

export interface Photo {
  /** public 폴더 기준 경로. 예: /img/photos/a.jpg */
  src: string;
  /** 사진을 설명하는 대체 텍스트 */
  alt: string;
  title?: string;
  series?: string;
  date?: string;
  /** 크롭 기준점. CSS object-position 값. 예: "35% 60%" */
  position?: string;
}

export interface Video {
  provider: "youtube" | "vimeo";
  /** 영상 주소에 들어 있는 ID */
  id: string;
  title: string;
  date?: string;
  /** 맡은 역할. 예: 촬영, 편집 */
  role?: string;
  /** public 폴더 기준 썸네일 경로. Vimeo는 필수, YouTube는 자동 썸네일 대신 쓸 때 지정 */
  thumbnail?: string;
}

export const photos = photosData as Photo[];
export const videos = videosData as Video[];
export const projects = projectsData;

/** 개수를 프레임 번호처럼 두 자리로 표시한다. */
export const padCount = (count: number) => String(count).padStart(2, "0");

export const getVideoThumbnail = (video: Video): string | null => {
  if (video.thumbnail) return video.thumbnail;
  if (video.provider === "youtube") {
    return `https://i.ytimg.com/vi/${encodeURIComponent(video.id)}/hqdefault.jpg`;
  }
  return null;
};

export const getVideoEmbedUrl = (video: Video): string => {
  const id = encodeURIComponent(video.id);
  return video.provider === "youtube"
    ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`
    : `https://player.vimeo.com/video/${id}?autoplay=1&dnt=1`;
};
