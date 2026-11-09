import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getOwnerSession } from "@/lib/write/session";
import { WriteError, listStoredPosts } from "@/lib/write/github";
import WriteList from "@/components/write/WriteList";

// 로그인한 주인에게만 제목을 붙이고, 검색에는 나오지 않게 한다.
export async function generateMetadata(): Promise<Metadata> {
  if (!(await getOwnerSession())) return {};
  return { title: "Write", robots: { index: false, follow: false } };
}

export default async function WritePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getOwnerSession();
  if (locale !== "ko" || !session) notFound();

  let posts: Awaited<ReturnType<typeof listStoredPosts>> = [];
  let error: string | null = null;
  let authExpired = false;
  try {
    posts = await listStoredPosts(session.token);
  } catch (e) {
    if (e instanceof WriteError && e.message === "AUTH") authExpired = true;
    else error = e instanceof Error ? e.message : "글 목록을 불러오지 못했어요.";
  }

  return <WriteList posts={posts} error={error} authExpired={authExpired} login={session.login} />;
}
