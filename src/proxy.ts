import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // api, Next.js 내부 파일, 점이 들어간 파일(favicon.ico 등), 공유 이미지(사이트 기본·글)는 제외한다
  matcher: "/((?!api|trpc|_next|_vercel|opengraph-image|posts/[^/]+/opengraph-image|.*\\..*).*)",
};
