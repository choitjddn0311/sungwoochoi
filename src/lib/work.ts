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

export type Project = (typeof projectsData)[number];

/** 언어에 맞는 프로젝트 제목, 설명, 기간. 영어가 없으면 한국어를 쓴다. */
export const localizeProject = (project: Project, locale: string, inProgressLabel: string) => {
  const en = locale === "en";
  return {
    ...project,
    title: (en && project.title_en) || project.title,
    description: (en && project.description_en) || project.description,
    period: project.period.replace("개발중", inProgressLabel),
  };
};

/** 개수를 프레임 번호처럼 두 자리로 표시한다. */
export const padCount = (count: number) => String(count).padStart(2, "0");

/** hd를 켜면 큰 화면용 고화질 썸네일을 준다. 고화질이 없는 영상도 있으므로 실패하면 끄고 다시 부른다. */
export const getVideoThumbnail = (video: Video, hd = false): string | null => {
  if (video.thumbnail) return video.thumbnail;
  if (video.provider === "youtube") {
    return `https://i.ytimg.com/vi/${encodeURIComponent(video.id)}/${hd ? "maxresdefault" : "hqdefault"}.jpg`;
  }
  return null;
};

export const getVideoEmbedUrl = (video: Video): string => {
  const id = encodeURIComponent(video.id);
  return video.provider === "youtube"
    ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`
    : `https://player.vimeo.com/video/${id}?autoplay=1&dnt=1`;
};
