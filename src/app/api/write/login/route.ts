import { NextRequest, NextResponse } from "next/server";
import { STATE_COOKIE, cookieBase, isValidEntryKey, isWriteConfigured, writeConfig } from "@/lib/write/session";

// 비밀 입구: /api/write/login?key=<WRITE_ENTRY_KEY>
// 키가 없거나 틀리면 일반 404와 같은 응답을 보낸다.
export async function GET(request: NextRequest) {
  if (!isWriteConfigured() || !isValidEntryKey(request.nextUrl.searchParams.get("key"))) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const state = crypto.randomUUID();
  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", writeConfig.clientId);
  authorize.searchParams.set("redirect_uri", `${request.nextUrl.origin}/api/write/callback`);
  authorize.searchParams.set("scope", "public_repo");
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("allow_signup", "false");

  const response = NextResponse.redirect(authorize);
  response.cookies.set(STATE_COOKIE, state, { ...cookieBase, httpOnly: true, maxAge: 600 });
  return response;
}
