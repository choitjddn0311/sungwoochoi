"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";

interface TagFilterProps {
  tags: { tag: string; count: number }[];
}

const TagFilter = ({ tags }: TagFilterProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedTag = searchParams.get("tag") ?? "";
  const query = searchParams.get("q") ?? "";

  const handleSelect = (tag: string) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (tag && tag !== selectedTag) params.set("tag", tag);
    const qs = params.toString();
    router.push(qs ? `/posts?${qs}` : "/posts");
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => handleSelect("")}
        className={`meta min-h-9 cursor-pointer px-2 transition-colors duration-150 ${
          !selectedTag
            ? "bg-foreground text-background"
            : "text-muted hover:text-foreground"
        }`}
      >
        전체
      </button>
      {tags.map(({ tag, count }) => (
        <button
          key={tag}
          onClick={() => handleSelect(tag)}
          className={`meta min-h-9 cursor-pointer px-2 transition-colors duration-150 ${
            selectedTag === tag
              ? "bg-foreground text-background"
              : "text-muted hover:text-foreground"
          }`}
        >
          {tag}
          <span className="ml-1">{count}</span>
        </button>
      ))}
    </div>
  );
};

export default TagFilter;
