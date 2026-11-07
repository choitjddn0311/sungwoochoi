import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { siteConfig } from "@/lib/siteConfig";

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

// 4단계에서 작품 화면을 구현한다. 지금은 작품이 없을 때의 안내만 보여 준다.
const Photo = async () => {
  const t = await getTranslations("work");

  return (
    <div className="wrap py-20 flex flex-col gap-3">
      <h1 className="display-kr text-[clamp(30px,5vw,68px)]">{t("photoEmpty")}</h1>
      <p className="meta text-muted">{t("emptyHint")}</p>
    </div>
  );
};

export default Photo;
