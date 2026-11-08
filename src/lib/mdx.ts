import rehypePrettyCode from "rehype-pretty-code";
import remarkGfm from "remark-gfm";
import type { MDXRemoteProps } from "next-mdx-remote/rsc";

// 글 상세 페이지와 /write 미리보기가 같은 렌더링을 쓰도록 MDX 설정을 한곳에 둔다.
export const mdxOptions: MDXRemoteProps["options"] = {
  mdxOptions: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [[rehypePrettyCode, { theme: "github-dark" }]],
  },
};
