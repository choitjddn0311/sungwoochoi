"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import type { StoredPost } from "@/lib/write/github";

type Filter = "all" | "published" | "draft";

type Props = { posts: StoredPost[]; error: string | null; authExpired: boolean; login: string };

export default function WriteList({ posts, error, authExpired, login }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const drafts = posts.filter((post) => post.draft).length;
  const shown = posts.filter((post) => filter === "all" || (filter === "draft" ? post.draft : !post.draft));

  const tabs: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "전체", count: posts.length },
    { id: "published", label: "발행", count: posts.length - drafts },
    { id: "draft", label: "임시저장", count: drafts },
  ];

  return (
    <div className="wrap pt-[clamp(24px,5vw,64px)]">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <h1 className="display text-[clamp(56px,calc(var(--u)*9),150px)]">Write</h1>
        <div className="flex items-center gap-3">
          <form action="/api/write/logout" method="post">
            <button type="submit" className="tap meta px-2 text-muted transition-colors hover:text-foreground">
              로그아웃 · {login}
            </button>
          </form>
          <Link href="/write/new" className="tap bg-foreground px-5 text-[15px] text-background">
            새 글 쓰기
          </Link>
        </div>
      </div>

      <div className="flex gap-5 py-3" role="tablist" aria-label="글 종류">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={filter === tab.id}
            onClick={() => setFilter(tab.id)}
            className={`tap tap-start text-[15px] ${filter === tab.id ? "text-foreground underline underline-offset-[6px]" : "text-muted"}`}
          >
            {tab.label} {tab.count}
          </button>
        ))}
      </div>

      {authExpired && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-4 border border-line p-4 text-[15px]">
          <p className="text-muted">GitHub 로그인이 만료됐어요. 로그아웃한 뒤 다시 로그인해 주세요.</p>
          <form action="/api/write/logout" method="post">
            <button type="submit" className="tap bg-foreground px-5 text-background">
              로그아웃
            </button>
          </form>
        </div>
      )}

      {error && (
        <p role="alert" className="border border-line p-4 text-[15px] text-muted">
          {error}
        </p>
      )}

      <ul>
        {shown.map((post) => (
          <li key={post.path} className="border-b border-line">
            <Link
              href={post.draft ? `/write/${post.slug}?draft=1` : `/write/${post.slug}`}
              className="invert-row grid grid-cols-[1fr_auto] items-baseline gap-x-5 gap-y-1 py-4 sm:grid-cols-[120px_1fr_auto]"
            >
              <span className="meta tabular-nums text-muted">
                {post.draft ? <span className="border border-foreground px-2 py-0.5 text-foreground">임시저장</span> : post.date}
              </span>
              <span className="col-span-2 font-kr text-[clamp(18px,2vw,24px)] font-light sm:col-span-1">{post.title || post.slug}</span>
              <span className="meta hidden text-muted sm:inline">수정 →</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="gap-m" />
      <div className="section-foot">
        <span className="display">{String(shown.length).padStart(2, "0")}</span>
        <span className="meta text-muted">글은 저장소(src/posts)의 최신 상태를 보여 줘요</span>
      </div>
      <div className="gap-l" />
    </div>
  );
}
