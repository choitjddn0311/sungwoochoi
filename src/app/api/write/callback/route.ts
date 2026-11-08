import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  STATE_COOKIE,
  UI_COOKIE,
  cookieBase,
  isWriteConfigured,
  safeEqual,
  sealSession,
  writeConfig,
} from "@/lib/write/session";

const notFound = () => new NextResponse("Not Found", { status: 404 });

function page(title: string, body: string, status: number) {
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#000;color:#fff;font-family:system-ui,sans-serif;word-break:keep-all;padding:24px}main{max-width:420px}p{color:#a3a3a3;line-height:1.7}a{color:#fff}</style></head>
<body><main><h1 style="font-weight:300">${title}</h1><p>${body}</p><p><a href="/">사이트로 돌아가기</a></p></main></body></html>`;
  return new NextResponse(html, { status, headers: { "content-type": "text/html; charset=utf-8" } });
}

export async function GET(request: NextRequest) {
  if (!isWriteConfigured()) return notFound();

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const savedState = request.cookies.get(STATE_COOKIE)?.value;
  if (!code || !state || !savedState || !safeEqual(state, savedState)) return notFound();

  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: writeConfig.clientId,
      client_secret: writeConfig.clientSecret,
      code,
      redirect_uri: `${request.nextUrl.origin}/api/write/callback`,
    }),
  });
  const tokenData = (await tokenResponse.json()) as { access_token?: string };
  if (!tokenData.access_token) {
    return page("로그인하지 못했어요", "GitHub에서 로그인 정보를 받지 못했어요. 비밀 입구 주소로 다시 시도해 주세요.", 400);
  }

  const userResponse = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: "application/vnd.github+json" },
  });
  const user = (await userResponse.json()) as { login?: string };

  if (user.login !== writeConfig.owner) {
    const denied = page(
      "이 계정으로는 글을 쓸 수 없어요",
      "사이트 주인 계정으로만 로그인할 수 있어요. GitHub에서 다른 계정으로 바꾼 뒤 다시 시도해 주세요.",
      403,
    );
    denied.cookies.delete(STATE_COOKIE);
    return denied;
  }

  const sealed = await sealSession({
    token: tokenData.access_token,
    login: user.login,
    exp: Date.now() + SESSION_MAX_AGE * 1000,
  });

  const response = NextResponse.redirect(new URL("/write", request.nextUrl.origin));
  response.cookies.delete(STATE_COOKIE);
  response.cookies.set(SESSION_COOKIE, sealed, { ...cookieBase, httpOnly: true, maxAge: SESSION_MAX_AGE });
  response.cookies.set(UI_COOKIE, "1", { ...cookieBase, httpOnly: false, maxAge: SESSION_MAX_AGE });
  return response;
}
