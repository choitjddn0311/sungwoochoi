import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import SectionFooter from "@/components/common/SectionFooter";
import PhotoScroller from "@/components/work/PhotoScroller";
import { photos } from "@/lib/work";
import { siteConfig } from "@/lib/siteConfig";
import { pageMetadata } from "@/lib/seo";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "photo", path: "/work/photo",
    // 작품을 넣기 전까지는 검색 결과에서 뺀다
    index: photos.length > 0 });
}

const Photo = async ({ params }: PageProps) => {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("work");

  return (
    <>
      <h1 className="sr-only">{t("photo")}</h1>
      {photos.length === 0 ? (
        <div className="wrap flex flex-col gap-3 py-[clamp(32px,6vw,84px)]">
          <p className="display-kr text-[clamp(30px,5vw,68px)]">{t("photoEmpty")}</p>
          <p className="meta text-muted">{t("emptyHint")}</p>
        </div>
      ) : (
        <>
          <PhotoScroller photos={photos} label={t("photoListLabel")} />
          <div className="wrap flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-line pt-4">
            <p className="meta text-muted">{t("photoAccount")}</p>
            <a
              href={siteConfig.social.photoInstagram}
              target="_blank"
              rel="noreferrer"
              className="font-latin text-[clamp(20px,2.2vw,28px)] font-light tracking-[-0.02em] underline-offset-[6px] hover:underline"
            >
              @chooi.film ↗
            </a>
          </div>
          <div className="gap-l" />
        </>
      )}
      <SectionFooter count={photos.length} label="PHOTOS" />
      <div className="gap-l" />
    </>
  );
};

export default Photo;
