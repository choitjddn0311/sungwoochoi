// 편집기와 서버가 함께 쓰는 글 형식 규칙. 브라우저에서도 쓰므로 Node 전용 모듈을 넣지 않는다.

export type PostFields = {
  title: string;
  date: string;
  summary: string;
  tags: string[];
};

export const POSTS_DIR = "src/posts";
export const DRAFTS_DIR = "src/posts/drafts";
export const IMAGES_DIR = "public/img/posts";

// 기존 글 주소와 같은 형식: 영문 소문자, 숫자, 하이픈
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function postPath(slug: string, draft: boolean) {
  return `${draft ? DRAFTS_DIR : POSTS_DIR}/${slug}.mdx`;
}

export function imagePublicPath(slug: string, filename: string) {
  return `/img/posts/${slug}/${filename}`;
}

// 기존 글과 같은 frontmatter 모양으로 쓴다.
export function serializePost(fields: PostFields, body: string): string {
  const tags = fields.tags.map((tag) => JSON.stringify(tag)).join(", ");
  return [
    "---",
    `title: ${JSON.stringify(fields.title)}`,
    `date: ${JSON.stringify(fields.date)}`,
    `summary: ${JSON.stringify(fields.summary)}`,
    `tags: [${tags}]`,
    "---",
    "",
    body.replace(/^\n+/, "").replace(/\s*$/, "\n"),
  ].join("\n");
}

export function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

// 제목의 영문과 숫자만으로 주소를 제안한다. 한글 제목이면 빈 값이 되므로 직접 입력한다.
export function suggestSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .replace(/[\s-]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export function todayKst(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
