import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import FrameStrip from "@/components/common/FrameStrip";
import SectionFooter from "@/components/common/SectionFooter";
import { photoRatio, photos } from "@/lib/work";
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
          <div className="gap-m" />
          <FrameStrip
            large
            label={t("photoStripLabel")}
            items={photos.map((photo) => ({
              key: photo.src,
              title: [photo.title, photo.series, photo.date].filter(Boolean).join(" · "),
              image: { src: photo.src, alt: photo.alt, ratio: photoRatio(photo) },
            }))}
          />
          <div className="gap-l" />
          <div className="wrap photo-grid">
            {photos.map((photo) => {
              const landscape = photoRatio(photo) > 1;
              const info = [photo.place, photo.camera, photo.lens].filter(Boolean).join(" · ");
              return (
                <figure key={photo.src} data-orient={landscape ? "landscape" : "portrait"}>
                  <div className="photo">
                    <Image
                      src={photo.src}
                      alt={photo.alt}
                      width={photo.width}
                      height={photo.height}
                      sizes={landscape ? "(max-width: 680px) 100vw, 72vw" : "(max-width: 680px) 100vw, 40vw"}
                      className="block h-auto w-full"
                    />
                  </div>
                  <figcaption className="meta mt-3 flex flex-col gap-0.5">
                    <span>{[photo.title, photo.date].filter(Boolean).join(" · ")}</span>
                    {info && <span className="text-muted">{info}</span>}
                  </figcaption>
                </figure>
              );
            })}
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
