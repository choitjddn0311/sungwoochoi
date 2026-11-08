import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import SectionFooter from "@/components/common/SectionFooter";
import VideoFrame from "@/components/work/VideoFrame";
import { videos } from "@/lib/work";
import { pageMetadata } from "@/lib/seo";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "film", path: "/work/film",
    // 작품을 넣기 전까지는 검색 결과에서 뺀다
    index: videos.length > 0 });
}

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
            {videos.map((video) => (
              <article key={`${video.provider}-${video.id}`} className="film-item">
                <VideoFrame video={video} />
                <h2 className="film-title">{video.title}</h2>
                <p className="meta flex flex-wrap gap-x-4 text-muted">
                  {video.date && <span>{video.date}</span>}
                  {video.role && <span>{video.role}</span>}
                </p>
              </article>
            ))}
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
