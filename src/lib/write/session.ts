import { cookies } from "next/headers";
import { timingSafeEqual } from "crypto";

// 글쓰기(/write)는 사이트 주인 한 명만 쓴다.
// GitHub 로그인 토큰을 AES-GCM으로 암호화해 httpOnly 쿠키에 넣고, 요청마다 다시 확인한다.

export const SESSION_COOKIE = "write_session";
// 푸터에 write 링크를 보여 줄지만 알려 주는 표시. 비밀 값은 들어 있지 않다.
export const UI_COOKIE = "write_ui";
export const STATE_COOKIE = "write_state";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type WriteSession = { token: string; login: string; exp: number };

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`환경변수 ${name}이(가) 없습니다.`);
  return value;
}

export const writeConfig = {
  get owner() {
    return env("WRITE_OWNER");
  },
  get repo() {
    return process.env.WRITE_REPO ?? "choitjddn0311/sungwoochoi";
  },
  get branch() {
    return process.env.WRITE_BRANCH ?? "master";
  },
  get clientId() {
    return env("GITHUB_CLIENT_ID");
  },
  get clientSecret() {
    return env("GITHUB_CLIENT_SECRET");
  },
};

// 설정이 빠진 배포에서는 편집기를 통째로 숨긴다.
export function isWriteConfigured(): boolean {
  return ["AUTH_SECRET", "WRITE_OWNER", "WRITE_ENTRY_KEY", "GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"].every(
    (name) => !!process.env[name],
  );
}

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function isValidEntryKey(key: string | null): boolean {
  const expected = process.env.WRITE_ENTRY_KEY;
  return !!key && !!expected && safeEqual(key, expected);
}

async function getKey(): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(env("AUTH_SECRET")));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function sealSession(session: WriteSession): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(JSON.stringify(session));
  const sealed = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await getKey(), data));
  return Buffer.concat([Buffer.from(iv), Buffer.from(sealed)]).toString("base64url");
}

async function unsealSession(value: string): Promise<WriteSession | null> {
  try {
    const raw = Buffer.from(value, "base64url");
    const iv = raw.subarray(0, 12);
    const data = raw.subarray(12);
    const opened = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, await getKey(), data);
    return JSON.parse(new TextDecoder().decode(opened)) as WriteSession;
  } catch {
    return null;
  }
}

// 로그인한 사이트 주인이면 세션을, 아니면 null을 돌려준다.
export async function getOwnerSession(): Promise<WriteSession | null> {
  if (!isWriteConfigured()) return null;
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!value) return null;
  const session = await unsealSession(value);
  if (!session || session.exp < Date.now() || session.login !== writeConfig.owner) return null;
  return session;
}

export async function requireOwner(): Promise<WriteSession> {
  const session = await getOwnerSession();
  if (!session) throw new Error("로그인이 필요해요. 다시 로그인해 주세요.");
  return session;
}

export const cookieBase = {
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};
