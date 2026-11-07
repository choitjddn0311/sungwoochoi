import type { PostMeta } from "@/lib/posts";
import { getTranslations } from "next-intl/server";
import PostRow from "./PostRow";

interface RelatedPostsProps {
  posts: PostMeta[];
}

const RelatedPosts = async ({ posts }: RelatedPostsProps) => {
  if (posts.length === 0) return null;
  const t = await getTranslations("post");

  return (
    <section aria-labelledby="related-title" className="wrap pt-[clamp(48px,7vw,96px)]">
      <h2 id="related-title" className="meta pb-3.5 text-muted">{t("relatedPosts")}</h2>
      {posts.map((post) => (
        <PostRow key={post.slug} post={post} />
      ))}
    </section>
  );
};

export default RelatedPosts;
