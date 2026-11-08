import { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";
import { siteConfig } from "@/lib/siteConfig";
import { photos, videos } from "@/lib/work";
import { routing } from "@/i18n/routing";
import { languageAlternates, localizedPath } from "@/lib/seo";

const absolute = (paths: Record<string, string>) =>
  Object.fromEntries(Object.entries(paths).map(([lang, path]) => [lang, `${siteConfig.url}${path === "/" ? "" : path}`]));

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();

  // 한국어와 영어가 모두 있는 페이지. 사진·영상 페이지는 작품이 있을 때만 넣는다.
  const pages: { path: string; changeFrequency: "weekly" | "monthly"; priority: number }[] = [
    { path: "/", changeFrequency: "monthly", priority: 1 },
    { path: "/work", changeFrequency: "monthly", priority: 0.7 },
    { path: "/work/dev", changeFrequency: "monthly", priority: 0.7 },
    ...(photos.length > 0 ? [{ path: "/work/photo", changeFrequency: "monthly" as const, priority: 0.7 }] : []),
    ...(videos.length > 0 ? [{ path: "/work/film", changeFrequency: "monthly" as const, priority: 0.7 }] : []),
    { path: "/posts", changeFrequency: "weekly", priority: 0.8 },
    { path: "/about", changeFrequency: "monthly", priority: 0.5 },
  ];

  const pageUrls: MetadataRoute.Sitemap = pages.flatMap((page) =>
    routing.locales.map((locale) => ({
      url: absolute({ url: localizedPath(locale, page.path) }).url,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: { languages: absolute(languageAlternates(page.path)) },
    })),
  );

  // 글은 한국어로만 있으므로 한국어 주소만 넣는다
  const postUrls: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteConfig.url}/posts/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...pageUrls, ...postUrls];
}
