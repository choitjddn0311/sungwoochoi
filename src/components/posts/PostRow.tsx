import { Link } from "@/i18n/navigation";
import type { PostMeta } from "@/lib/posts";

type Props = {
  post: PostMeta;
  /** 홈처럼 짧게 보여 줄 때: 요약 없이 날짜와 제목만 */
  compact?: boolean;
};

/** 큰 제목으로 보여 주는 글 목록 한 줄 */
const PostRow = ({ post, compact = false }: Props) => (
  <Link href={`/posts/${post.slug}`} className="invert-row block border-t border-line py-[clamp(14px,2vw,26px)]">
    <span className="meta flex flex-wrap gap-x-4 pb-1.5 text-muted">
      <time dateTime={post.date}>{post.date}</time>
      {!compact && <span>{post.summary}</span>}
    </span>
    <span className="post-title block">{post.title}</span>
  </Link>
);

export default PostRow;
