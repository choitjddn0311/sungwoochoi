import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, UI_COOKIE } from "@/lib/write/session";

// 로그아웃은 폼 전송(POST)으로만 받는다. 링크만 눌러서 로그아웃되지 않게 한다.
export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.nextUrl.origin), 303);
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(UI_COOKIE);
  return response;
}
