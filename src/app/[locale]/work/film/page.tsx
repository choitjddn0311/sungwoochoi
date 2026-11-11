import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import SectionFooter from "@/components/common/SectionFooter";
import VideoFrame from "@/components/work/VideoFrame";
import { isVerticalVideo, videos, type Video } from "@/lib/work";
import { pageMetadata } from "@/lib/seo";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "film", path: "/work/film",
    // 작품을 넣기 전까지는 검색 결과에서 뺀다
    index: videos.length > 0 });
}

/** 가로 영상은 하나씩, 이어서 나오는 세로 영상(쇼츠, 릴스)은 3개까지 한 줄로 묶는다. */
function groupVideos(list: Video[]): Video[][] {
  const groups: Video[][] = [];
  for (const video of list) {
    const last = groups.at(-1);
    if (isVerticalVideo(video) && last && isVerticalVideo(last[0]) && last.length < 3) last.push(video);
    else groups.push([video]);
  }
  return groups;
}

const FilmItem = ({ video, side }: { video: Video; side?: string }) => (
  <article className="film-item" data-vertical={isVerticalVideo(video)} data-side={side}>
    <VideoFrame video={video} />
    <h2 className="film-title">{video.title}</h2>
    <p className="meta flex flex-wrap gap-x-4 text-muted">
      {video.date && <span>{video.date}</span>}
      {video.role && <span>{video.role}</span>}
    </p>
  </article>
);

const Film = async ({ params }: PageProps) => {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("work");

  return (
    <>
      <h1 className="sr-only">{t("film")}</h1>
      {videos.length === 0 ? (
        <div className="wrap flex flex-col gap-3 py-[clamp(32px,6vw,84px)]">
          <p className="display-kr text-[clamp(30px,5vw,68px)]">{t("filmEmpty")}</p>
          <p className="meta text-muted">{t("emptyHint")}</p>
        </div>
      ) : (
        <>
          <div className="gap-m" />
          <div className="wrap film-list">
            {groupVideos(videos).map((group, i) => {
              const side = i % 2 === 1 ? "right" : "left";
              const key = `${group[0].provider}-${group[0].id}`;
              return isVerticalVideo(group[0]) ? (
                <div key={key} className="film-shorts" data-side={side}>
                  {group.map((video) => (
                    <FilmItem key={`${video.provider}-${video.id}`} video={video} />
                  ))}
                </div>
              ) : (
                <FilmItem key={key} video={group[0]} side={side} />
              );
            })}
          </div>
          <div className="gap-l" />
        </>
      )}
      <SectionFooter count={videos.length} label="FILMS" />
      <div className="gap-l" />
    </>
  );
};

export default Film;
