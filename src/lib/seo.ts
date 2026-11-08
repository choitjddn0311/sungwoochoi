import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { siteConfig } from "@/lib/siteConfig";

// app/opengraph-image.tsx가 만드는 사이트 기본 공유 이미지
const DEFAULT_OG_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: siteConfig.name };

const OG_LOCALE: Record<Locale, string> = { ko: "ko_KR", en: "en_US" };

/** 언어에 맞는 주소. 한국어는 접두어 없이, 영어는 /en을 붙인다. */
export const localizedPath = (locale: string, path: string) =>
  locale === routing.defaultLocale ? path : `/${locale}${path === "/" ? "" : path}`;

/** 같은 페이지의 언어별 주소. 검색엔진에 한국어·영어 짝을 알린다(hreflang). */
export const languageAlternates = (path: string) => ({
  ko: localizedPath("ko", path),
  en: localizedPath("en", path),
  "x-default": localizedPath(routing.defaultLocale, path),
});

type PageKey = "home" | "work" | "dev" | "photo" | "film" | "posts" | "about";

interface PageMetadataOptions {
  locale: string;
  /** messages의 meta.{page}에 있는 제목과 설명을 쓴다 */
  page: PageKey;
  /** 언어 접두어를 뺀 주소. 예: "/work/dev" */
  path: string;
  /** false면 검색 결과에서 뺀다. 내용이 아직 없는 페이지에 쓴다. */
  index?: boolean;
}

/**
 * 페이지 메타데이터를 한 형식으로 만든다.
 * 페이지에서 openGraph를 지정하면 레이아웃의 값을 통째로 덮어쓰므로, 공유 이미지와 대표 주소를 여기서 함께 넣는다.
 */
export const pageMetadata = async ({ locale, page, path, index = true }: PageMetadataOptions): Promise<Metadata> => {
  const t = await getTranslations({ locale, namespace: "meta" });
  const isHome = path === "/";
  const title = t(`${page}.title`);
  const description = t(`${page}.description`);
  const fullTitle = isHome ? siteConfig.name : `${title} | ${siteConfig.name}`;
  const url = localizedPath(locale, path);

  return {
    title: isHome ? { absolute: siteConfig.name } : title,
    description,
    alternates: { canonical: url, languages: languageAlternates(path) },
    openGraph: {
      type: "website",
      locale: OG_LOCALE[locale as Locale] ?? OG_LOCALE.ko,
      siteName: siteConfig.name,
      title: fullTitle,
      description,
      url,
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [DEFAULT_OG_IMAGE.url],
    },
    ...(index ? {} : { robots: { index: false, follow: true } }),
  };
};

/** 구조화 데이터를 <script>에 안전하게 넣는다. */
export const jsonLd = (data: object) => ({
  __html: JSON.stringify(data).replace(/</g, "\\u003c"),
});
