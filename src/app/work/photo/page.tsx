import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import FrameStrip from "@/components/common/FrameStrip";
import SectionFooter from "@/components/common/SectionFooter";
import { siteConfig } from "@/lib/siteConfig";
import { photos } from "@/lib/work";

export const metadata: Metadata = {
  title: "Photo",
  description: "최성우의 사진 작업입니다.",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: siteConfig.name,
    title: `Photo | ${siteConfig.name}`,
    description: "최성우의 사진 작업입니다.",
    url: `${siteConfig.url}/work/photo`,
  },
};

const Photo = async () => {
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
          <div className="gap-m" />
          <FrameStrip
            large
            label={t("photoStripLabel")}
            items={photos.map((photo) => ({
              key: photo.src,
              title: [photo.title, photo.series, photo.date].filter(Boolean).join(" · "),
              image: { src: photo.src, alt: photo.alt, position: photo.position },
            }))}
          />
          <div className="gap-l" />
          <div className="wrap photo-grid">
            {photos.map((photo) => (
              <figure key={photo.src} className="photo">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 680px) 100vw, 42vw"
                  className="object-cover"
                  style={photo.position ? { objectPosition: photo.position } : undefined}
                />
              </figure>
            ))}
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
