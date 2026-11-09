import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getOwnerSession } from "@/lib/write/session";
import { WriteError, loadStoredPost } from "@/lib/write/github";
import { redirect } from "@/i18n/navigation";
import { SLUG_PATTERN, postPath, todayKst } from "@/lib/write/post";
import Editor, { type EditorInitial } from "@/components/write/Editor";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ draft?: string }>;
};

// 로그인한 주인에게만 제목을 붙이고, 검색에는 나오지 않게 한다.
export async function generateMetadata(): Promise<Metadata> {
  if (!(await getOwnerSession())) return {};
  return { title: "Write", robots: { index: false, follow: false } };
}

export default async function WriteEditPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  const { draft } = await searchParams;
  setRequestLocale(locale);
  const session = await getOwnerSession();
  if (locale !== "ko" || !session) notFound();

  let initial: EditorInitial;
  if (slug === "new") {
    initial = {
      slug: "",
      fields: { title: "", date: todayKst(), summary: "", tags: [] },
      body: "",
      originalPath: null,
      originalSha: null,
    };
  } else {
    if (!SLUG_PATTERN.test(slug)) notFound();
    let stored: Awaited<ReturnType<typeof loadStoredPost>>;
    try {
      stored = await loadStoredPost(session.token, postPath(slug, draft === "1"));
    } catch (e) {
      // 토큰이 무효면 목록으로 보내 다시 로그인 안내를 보여 준다.
      if (e instanceof WriteError && e.message === "AUTH") redirect({ href: "/write", locale });
      throw e;
    }
    if (!stored) notFound();
    initial = {
      slug: stored.slug,
      fields: { title: stored.title, date: stored.date, summary: stored.summary, tags: stored.tags },
      body: stored.body,
      originalPath: stored.path,
      originalSha: stored.sha,
    };
  }

  return <Editor initial={initial} />;
}
