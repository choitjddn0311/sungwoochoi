import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// 현재 언어를 유지하는 Link, 라우터, 경로 함수
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
