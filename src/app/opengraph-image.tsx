import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";
import { siteConfig } from "@/lib/siteConfig";

export const runtime = "nodejs";
export const alt = "Sungwoo Choi";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  const fontData = readFileSync(join(process.cwd(), "src/fonts/Griun.ttf"));

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
        <div style={{ display: "flex", fontSize: "132px", lineHeight: "1.05" }}>Sungwoo Choi</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ display: "flex", fontSize: "38px" }}>developer / photographer / videographer</div>
          <div style={{ display: "flex", fontSize: "24px", color: "#a3a3a3" }}>{new URL(siteConfig.url).host}</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Griun", data: fontData, style: "normal" }],
    }
  );
}
