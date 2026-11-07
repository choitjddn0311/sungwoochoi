import type { MDXComponents } from "mdx/types";
import { slugify } from "@/lib/toc"; // ← 추가

// 더 안전한 버전
function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node && typeof node === "object" && "props" in node) {
    const props = (node as { props: { children?: React.ReactNode } }).props;
    return extractText(props.children);
  }
  return "";
}
function HeadingId(children: React.ReactNode): string {
  return slugify(extractText(children));
}

export const mdxComponents: MDXComponents = {
  h1: ({ children, ...props }) => (
    <h2
      id={HeadingId(children)}
      className="font-kr font-light text-[clamp(32px,4vw,46px)] tracking-[-0.03em] leading-[1.2] mt-14 mb-4 scroll-mt-16"
      {...props}
    >
      {children}
    </h2>
  ),
  h2: ({ children, ...props }) => (
    <h2
      id={HeadingId(children)}
      className="font-kr font-light text-[clamp(28px,3.4vw,40px)] tracking-[-0.03em] leading-[1.2] mt-12 mb-3 scroll-mt-16"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3
      id={HeadingId(children)}
      className="font-kr font-normal text-[21px] leading-[1.4] mt-8 mb-2 scroll-mt-16"
      {...props}
    >
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4
      id={HeadingId(children)}
      className="font-kr font-normal text-lg leading-[1.4] mt-6 mb-2 scroll-mt-16"
      {...props}
    >
      {children}
    </h4>
  ),

  p: (props) => <p className="my-4" {...props} />,
  a: (props) => <a className="underline underline-offset-4 hover:no-underline" {...props} />,
  ul: (props) => <ul className="list-disc my-4 space-y-1 pl-6 marker:text-muted" {...props} />,
  ol: (props) => <ol className="list-decimal my-4 space-y-1 pl-6 marker:text-muted" {...props} />,
  li: (props) => <li {...props} />,
  blockquote: (props) => (
    <blockquote
      className="font-kr font-light text-[clamp(21px,2.3vw,27px)] leading-normal tracking-[-0.02em] my-8 [&>p]:my-2"
      {...props}
    />
  ),
  code: (props) => <code className="bg-surface px-1.5 py-0.5 text-[0.88em] font-mono" {...props} />,
  pre: (props) => (
    <pre className="overflow-x-auto my-6 p-4 text-sm leading-relaxed [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-[1em]" {...props} />
  ),
  hr: () => <hr className="my-10 border-line" />,
  img: (props) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="my-6 max-w-full" alt={props.alt ?? ""} {...props} />
  ),
};
