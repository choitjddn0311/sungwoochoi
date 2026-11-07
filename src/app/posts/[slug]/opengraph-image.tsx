import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";
import { getPostBySlug, getAllSlugs } from "@/lib/posts";
import { siteConfig } from "@/lib/siteConfig";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { meta } = getPostBySlug(slug);
  const fontData = readFileSync(join(process.cwd(), "src/fonts/Griun.ttf"));

  const titleSize = meta.title.length > 30 ? "60px" : "84px";

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
          padding: "70px 80px",
          fontFamily: "Griun",
        }}
      >
        <div style={{ display: "flex", fontSize: "26px", color: "#a3a3a3" }}>
          {[meta.date, ...meta.tags.slice(0, 3)].join("  /  ")}
        </div>
        <div style={{ display: "flex", fontSize: titleSize, lineHeight: "1.25", wordBreak: "keep-all" }}>{meta.title}</div>
        <div style={{ display: "flex", fontSize: "30px" }}>{siteConfig.name}</div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Griun", data: fontData, style: "normal" }],
    }
  );
}
