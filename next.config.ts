// next.js용 설정파일

import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  // /write 편집기는 사진을 한 장씩 서버 액션으로 올린다(줄인 사진 기준 수 MB).
  experimental: {
    serverActions: { bodySizeLimit: "4mb" },
  },
  images: {
    // YouTube 영상 썸네일
    remotePatterns: [{ protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" }],
  },
  // 기존 주소로 들어온 방문자와 검색 결과를 새 주소로 보낸다.
  async redirects() {
    return [
      { source: "/projects", destination: "/work/dev", permanent: true },
      { source: "/en/projects", destination: "/en/work/dev", permanent: true },
    ];
  },
};

export default withNextIntl(nextConfig);
