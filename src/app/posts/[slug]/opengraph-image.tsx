import { ImageResponse } from "next/og";
import { getPostBySlug, getAllSlugs } from "@/lib/posts";
import { OG_LATIN, OG_SIZE, OgMark, ogFonts } from "@/lib/og";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = "image/png";

// 빌드 때 만든 글 이미지만 제공한다(글은 커밋으로 추가되므로 매번 다시 빌드된다).
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

// 제목 길이에 따라 글자 크기를 줄여 세 줄 안에 들어가게 한다.
function titleSize(title: string) {
  if (title.length > 24) return "68px";
  if (title.length > 14) return "84px";
  return "104px";
}

// 사이트 기본 이미지와 같은 머리줄(마크 + SUNGWOO CHOI) 아래에 글 제목을 크게 둔다.
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { meta } = getPostBySlug(slug);
  const tags = meta.tags.slice(0, 3).join("  /  ");
  const { fonts, krFamily } = ogFonts(meta.title + tags, [300]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#000000",
          color: "#ffffff",
          padding: "64px 72px",
          fontFamily: OG_LATIN,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "18px", fontSize: "26px", fontWeight: 400, letterSpacing: "0.02em" }}>
            <OgMark size={56} />
            SUNGWOO CHOI
          </div>
          <div style={{ display: "flex", fontSize: "24px", color: "#a3a3a3", fontWeight: 400 }}>{meta.date}</div>
        </div>

        <div
          style={{
            display: "flex",
            fontFamily: krFamily,
            fontSize: titleSize(meta.title),
            fontWeight: 300,
            letterSpacing: "-0.04em",
            lineHeight: 1.22,
            wordBreak: "keep-all",
          }}
        >
          {meta.title}
        </div>

        <div style={{ display: "flex", fontFamily: krFamily, fontSize: "26px", color: "#a3a3a3", fontWeight: 300 }}>{tags}</div>
      </div>
    ),
    {
      ...size,
      fonts,
    }
  );
}
