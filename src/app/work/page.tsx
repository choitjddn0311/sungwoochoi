import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { padCount, photos, projects, videos } from "@/lib/work";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Work",
  description: "최성우의 개발, 사진, 영상 작업입니다.",
  path: "/work",
});

const ROW = "invert-row flex items-baseline justify-between gap-4 py-[clamp(14px,2vw,26px)]";

const Work = async () => {
  const t = await getTranslations("work");

  return (
    <>
      <div className="wrap pt-[clamp(24px,5vw,64px)] pb-[clamp(20px,3vw,40px)]">
        <h1 className="display page-title">WORK</h1>
      </div>
      <div className="wrap">
        <Link href="/work/dev" className={`${ROW} border-t border-line`}>
          <span className="display-kr entry-label">{t("dev")}</span>
          <span className="display entry-label">{padCount(projects.length)}</span>
        </Link>
        <p className="meta border-t border-line py-2.5 text-muted">{t("media")}</p>
        <Link href="/work/photo" className={`${ROW} entry-sub`}>
          <span className="display-kr entry-label">{t("photo")}</span>
          <span className="display entry-label">{padCount(photos.length)}</span>
        </Link>
        <Link href="/work/film" className={`${ROW} entry-sub border-t border-line`}>
          <span className="display-kr entry-label">{t("film")}</span>
          <span className="display entry-label">{padCount(videos.length)}</span>
        </Link>
      </div>
      <div className="gap-l" />
    </>
  );
};

export default Work;
