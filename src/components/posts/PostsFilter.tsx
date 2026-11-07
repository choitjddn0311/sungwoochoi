"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

interface PostsFilterProps {
  tags: { tag: string; count: number }[];
}

const SEARCH_ID = "posts-search";

const tagClass = (selected: boolean) =>
  `meta min-h-9 cursor-pointer px-2 transition-colors duration-150 ${
    selected ? "bg-foreground text-background" : "text-muted hover:text-foreground"
  }`;

const PostsFilter = ({ tags }: PostsFilterProps) => {
  const t = useTranslations("posts");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");
  const [expanded, setExpanded] = useState(false);
  const selectedTag = searchParams.get("tag") ?? "";

  const VISIBLE_COUNT = 5;
  const hasMore = tags.length > VISIBLE_COUNT;
  const hiddenCount = tags.length - VISIBLE_COUNT;

  const selectedTagHidden =
    !expanded &&
    selectedTag !== "" &&
    !tags.slice(0, VISIBLE_COUNT).some((t) => t.tag === selectedTag);

  const visibleTags = expanded
    ? tags
    : [
        ...tags.slice(0, VISIBLE_COUNT),
        ...(selectedTagHidden ? tags.filter((t) => t.tag === selectedTag) : []),
      ];

  // 렌더 중 뮤테이션 대신 useEffect로 ref 동기화
  const selectedTagRef = useRef(selectedTag);
  useEffect(() => {
    selectedTagRef.current = selectedTag;
  }, [selectedTag]);

  // 검색 디바운스 (300ms) — useTransition 제거, router.replace 직접 호출
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (searchValue.trim()) params.set("q", searchValue.trim());
      if (selectedTagRef.current) params.set("tag", selectedTagRef.current);
      const qs = params.toString();
      router.replace(qs ? `/posts?${qs}` : "/posts");
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue, router]);

  const handleTagSelect = (tag: string) => {
    const params = new URLSearchParams();
    if (searchValue.trim()) params.set("q", searchValue.trim());
    if (tag && tag !== selectedTag) params.set("tag", tag);
    const qs = params.toString();
    router.push(qs ? `/posts?${qs}` : "/posts");
  };

  return (
    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3 pb-[clamp(24px,4vw,48px)]">
      {/* 태그 필터 */}
      <div role="group" aria-label={t("tagFilter")} className="flex flex-[1_1_320px] flex-wrap gap-x-1.5 gap-y-0.5">
        <button type="button" onClick={() => handleTagSelect("")} aria-pressed={!selectedTag} className={tagClass(!selectedTag)}>
          {t("allLabel")}
        </button>
        {visibleTags.map(({ tag, count }) => (
          <button
            key={tag}
            type="button"
            onClick={() => handleTagSelect(tag)}
            aria-pressed={selectedTag === tag}
            className={tagClass(selectedTag === tag)}
          >
            {tag} {count}
          </button>
        ))}

        {hasMore && !expanded && (
          <button type="button" onClick={() => setExpanded(true)} className={tagClass(false)}>
            {t("showMore", { count: hiddenCount })}
          </button>
        )}
        {expanded && (
          <button type="button" onClick={() => setExpanded(false)} className={tagClass(false)}>
            {t("collapse")}
          </button>
        )}
      </div>

      {/* 검색창 */}
      <div className="flex w-full flex-col gap-0.5 sm:w-72">
        <label htmlFor={SEARCH_ID} className="meta text-muted">{t("searchLabel")}</label>
        <input
          id={SEARCH_ID}
          type="search"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full border-b border-foreground bg-transparent py-2 text-base text-foreground placeholder:text-muted"
        />
      </div>
    </div>
  );
};

export default PostsFilter;
