import { Link } from "@/i18n/navigation";
import type { PostMeta } from "@/lib/posts";
import { getTranslations } from "next-intl/server";

interface PostNavProps {
  prev: PostMeta | null;
  next: PostMeta | null;
}

const TITLE = "font-kr font-light text-[clamp(19px,2.4vw,32px)] leading-[1.25] tracking-[-0.025em]";

const PostNav = async ({ prev, next }: PostNavProps) => {
  if (!prev && !next) return null;
  const t = await getTranslations("post");

  return (
    <div className="wrap">
      <nav aria-label={t("postNav")} className="grid grid-cols-2 border-t border-line">
        {prev ? (
          <Link href={`/posts/${prev.slug}`} className="invert-row flex flex-col gap-1.5 py-5 pr-4">
            <span className="meta text-muted">{t("prevPost")}</span>
            <span className={TITLE}>{prev.title}</span>
          </Link>
        ) : (
          <div />
        )}

        {next ? (
          <Link href={`/posts/${next.slug}`} className="invert-row flex flex-col gap-1.5 border-l border-line py-5 pl-4 text-right">
            <span className="meta text-muted">{t("nextPost")}</span>
            <span className={TITLE}>{next.title}</span>
          </Link>
        ) : (
          <div />
        )}
      </nav>
    </div>
  );
};

export default PostNav;
