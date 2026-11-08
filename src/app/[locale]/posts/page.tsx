import { getAllPosts, getTagList } from "@/lib/posts";
import PostRow from "@/components/posts/PostRow";
import PostsFilter from "@/components/posts/PostsFilter";
import { Link } from "@/i18n/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { padCount } from "@/lib/work";
import { pageMetadata } from "@/lib/seo";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "posts", path: "/posts" });
}

const POSTS_PER_PAGE = 12;
const PAGE_LINK = "tap meta px-2 transition-colors duration-150 hover:text-foreground";

const Posts = async ({ params, searchParams }: PageProps & { searchParams: Promise<{ page?: string; q?: string; tag?: string }> }) => {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("posts");
  const { page, q, tag } = await searchParams;
  const query = q?.trim() ?? "";
  const selectedTag = tag?.trim() ?? "";

  const allPosts = getAllPosts();
  const tagList = getTagList();

  const filteredPosts = allPosts
    .filter((post) => !selectedTag || post.tags.includes(selectedTag))
    .filter((post) =>
      !query ||
      post.title.toLowerCase().includes(query.toLowerCase()) ||
      post.summary.toLowerCase().includes(query.toLowerCase()) ||
      post.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()))
    );

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE));
  const currentPage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const posts = filteredPosts.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE);

  const paginationHref = (p: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (selectedTag) params.set("tag", selectedTag);
    params.set("page", String(p));
    return `/posts?${params.toString()}`;
  };

  return (
    <div className="wrap">
      <div className="flex items-baseline justify-between gap-4 pt-[clamp(24px,5vw,64px)] pb-[clamp(20px,3vw,40px)]">
        <span className="display page-title">{padCount(allPosts.length)}</span>
        <h1 className="display page-title">POSTS</h1>
      </div>

      <Suspense fallback={<div className="mb-10 h-20 animate-pulse bg-surface" />}>
        <PostsFilter tags={tagList} />
      </Suspense>

      {allPosts.length === 0 ? (
        <div className="flex flex-col gap-3 py-16">
          <p className="text-muted">{t("noPostsMessage")}</p>
          <p className="underline underline-offset-4"><Link href="/">{t("backToHome")}</Link></p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="flex flex-col gap-3 border-t border-line py-[clamp(32px,6vw,84px)]">
          <p className="display-kr text-[clamp(30px,5vw,68px)]">{t("noResultsTitle")}</p>
          <p className="meta text-muted">
            {selectedTag && <>#{selectedTag} {t("tagResultPrefix")}{query && " · "}</>}
            {query && <>&apos;{query}&apos;</>}
            {" "}{t("noResultsMessage")}
          </p>
        </div>
      ) : (
        <>
          {(query || selectedTag) && (
            <p className="meta pb-4 text-muted" aria-live="polite">
              {selectedTag && <span className="mr-1">#{selectedTag}</span>}
              {query && <>&apos;{query}&apos; </>}
              {t("resultCount", { count: filteredPosts.length })}
            </p>
          )}

          <div>
            {posts.map((post) => (
              <PostRow key={post.slug} post={post} />
            ))}
          </div>

          {totalPages > 1 && (
            <nav aria-label={t("pagination")} className="flex flex-wrap items-center justify-center gap-1 border-t border-line pt-6">
              {currentPage > 1 && (
                <Link href={paginationHref(currentPage - 1)} className={`${PAGE_LINK} text-muted`}>
                  {t("previous")}
                </Link>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={paginationHref(p)}
                  aria-current={p === currentPage ? "page" : undefined}
                  className={p === currentPage ? "tap meta bg-foreground text-background" : `${PAGE_LINK} text-muted`}
                >
                  {p}
                </Link>
              ))}
              {currentPage < totalPages && (
                <Link href={paginationHref(currentPage + 1)} className={`${PAGE_LINK} text-muted`}>
                  {t("next")}
                </Link>
              )}
            </nav>
          )}
        </>
      )}
      <div className="gap-l" />
    </div>
  );
};

export default Posts;
