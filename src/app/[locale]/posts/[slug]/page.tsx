import { getPostBySlug, getAllSlugs, getAdjacentPosts, getRelatedPosts } from "@/lib/posts";
import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "@/components/posts/mdxComponents";
import { mdxOptions } from "@/lib/mdx";
import { Link } from "@/i18n/navigation";
import { extractToc } from "@/lib/toc";
import TableOfContents from "@/components/posts/TableOfContents";
import Comments from "@/components/posts/Comments";
import PostNav from "@/components/posts/PostNav";
import RelatedPosts from "@/components/posts/RelatedPosts";
import { siteConfig } from "@/lib/siteConfig";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ReadingProgressBar from "@/components/posts/ReadingProgressBar";
import { jsonLd } from "@/lib/seo";
import type { Metadata } from "next";

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

type PostParams = { params: Promise<{ locale: string; slug: string }> };

// 글은 한국어로만 있으므로 영어 주소(/en/posts/...)도 한국어 원문을 대표 주소로 가리킨다
export async function generateMetadata({ params }: PostParams): Promise<Metadata> {
  const { slug } = await params;
  const { meta } = getPostBySlug(slug);
  const image = { url: `/posts/${slug}/opengraph-image`, width: 1200, height: 630, alt: meta.title };
  return {
    title: meta.title,
    description: meta.summary,
    keywords: meta.tags,
    alternates: { canonical: `/posts/${slug}` },
    openGraph: {
      type: "article",
      locale: "ko_KR",
      images: [image],
      siteName: siteConfig.name,
      title: meta.title,
      description: meta.summary,
      url: `${siteConfig.url}/posts/${slug}`,
      publishedTime: meta.date,
      tags: meta.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.summary,
      images: [image.url],
    },
  };
}

const PostPage = async ({ params }: PostParams) => {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const { meta, content } = getPostBySlug(slug);
  const tocItems = extractToc(content);
  const { prev, next } = getAdjacentPosts(slug);
  const relatedPosts = getRelatedPosts(slug, meta.tags);
  const t = await getTranslations("post");

  const articleData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: meta.title,
    description: meta.summary,
    datePublished: meta.date,
    keywords: meta.tags.join(", "),
    inLanguage: "ko",
    url: `${siteConfig.url}/posts/${slug}`,
    mainEntityOfPage: `${siteConfig.url}/posts/${slug}`,
    author: { "@type": "Person", name: siteConfig.author, url: `${siteConfig.url}/about` },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(articleData)} />
      <ReadingProgressBar />
      <article lang="ko">
        <header className="wrap flex flex-col gap-4.5 pt-[clamp(24px,5vw,64px)]">
          <Link href="/posts" className="tap tap-start meta self-start text-muted transition-colors duration-150 hover:text-foreground">
            {t("backToList")}
          </Link>
          <h1 className={`article-title ${meta.title.length > 24 ? "article-title-long" : "article-title-short"}`}>{meta.title}</h1>
          <p className="meta flex flex-wrap gap-x-3 text-muted">
            <time dateTime={meta.date}>{meta.date}</time>
            {meta.tags.length > 0 && <span>{meta.tags.join(" / ")}</span>}
          </p>
          {locale !== "ko" && <p lang="en" className="meta text-muted">{t("koreanOnly")}</p>}
        </header>
        <div className="gap-m" />

        <div className="wrap article-grid">
          <div className="article-body">
            <MDXRemote
              source={content}
              components={mdxComponents}
              options={mdxOptions}
            />
          </div>
          <aside className="article-toc">
            <TableOfContents items={tocItems} />
          </aside>
        </div>
      </article>

      <div className="gap-l" />
      <PostNav prev={prev} next={next} />
      <RelatedPosts posts={relatedPosts} />
      <Comments />
      <div className="gap-l" />
    </>
  );
};

export default PostPage;
