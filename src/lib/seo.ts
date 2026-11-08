import type { Metadata } from "next";
import { siteConfig } from "@/lib/siteConfig";

// app/opengraph-image.tsx가 만드는 사이트 기본 공유 이미지
const DEFAULT_OG_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: siteConfig.name };

interface PageMetadataOptions {
  /** 브라우저 탭과 검색 결과의 제목. 사이트 이름은 레이아웃 템플릿이 뒤에 붙인다. */
  title: string;
  description: string;
  /** 대표 주소. 예: "/work/dev" */
  path: string;
  /** false면 검색 결과에서 뺀다. 내용이 아직 없는 페이지에 쓴다. */
  index?: boolean;
}

/**
 * 페이지 메타데이터를 한 형식으로 만든다.
 * 페이지에서 openGraph를 지정하면 레이아웃의 값을 통째로 덮어쓰므로, 공유 이미지와 대표 주소를 여기서 함께 넣는다.
 */
export const pageMetadata = ({ title, description, path, index = true }: PageMetadataOptions): Metadata => {
  const fullTitle = path === "/" ? siteConfig.name : `${title} | ${siteConfig.name}`;

  return {
    title: path === "/" ? { absolute: siteConfig.name } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "ko_KR",
      siteName: siteConfig.name,
      title: fullTitle,
      description,
      url: path,
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
