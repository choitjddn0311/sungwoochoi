import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import SectionFooter from "@/components/common/SectionFooter";
import VideoFrame from "@/components/work/VideoFrame";
import { siteConfig } from "@/lib/siteConfig";
import { videos } from "@/lib/work";

export const metadata: Metadata = {
  title: "Film",
  description: "최성우의 영상 작업입니다.",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: siteConfig.name,
    title: `Film | ${siteConfig.name}`,
    description: "최성우의 영상 작업입니다.",
    url: `${siteConfig.url}/work/film`,
  },
};

const Film = async () => {
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
