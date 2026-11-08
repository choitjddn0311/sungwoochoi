import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // api, Next.js 내부 파일, 점이 들어간 파일(favicon.ico 등), 글 공유 이미지는 제외한다
  matcher: "/((?!api|trpc|_next|_vercel|posts/[^/]+/opengraph-image|.*\\..*).*)",
};
