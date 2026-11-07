"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const SearchInput = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (value.trim()) params.set("q", value.trim());
      const query = params.toString();
      router.replace(query ? `/posts?${query}` : "/posts");
    }, 300);
    return () => clearTimeout(timer);
  }, [value, router]);

  return (
    <div className="w-full sm:w-80">
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="제목, 내용, 태그 검색..."
        aria-label="검색"
        className="w-full border-b border-foreground bg-transparent py-2 text-base text-foreground placeholder:text-muted"
      />
    </div>
  );
};

export default SearchInput;
