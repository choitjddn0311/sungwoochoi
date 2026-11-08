import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ko", "en"],
  defaultLocale: "ko",
  // 한국어는 지금 주소 그대로(/about), 영어만 /en을 붙인다(/en/about)
  localePrefix: "as-needed",
  // 브라우저 언어로 자동 이동하지 않는다. 언어는 주소와 언어 버튼으로만 바뀐다.
  localeDetection: false,
  // 한국어로만 있는 글은 영어 짝을 알리지 않도록 hreflang을 메타데이터에서 직접 넣는다
  alternateLinks: false,
});

export type Locale = (typeof routing.locales)[number];
