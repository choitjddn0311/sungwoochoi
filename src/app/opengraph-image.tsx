import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/siteConfig";
import { OG_LATIN, OG_SIZE, OgMark, ogFonts } from "@/lib/og";

export const runtime = "nodejs";
export const alt = "Sungwoo Choi";
export const size = OG_SIZE;
export const contentType = "image/png";

// 사이트 첫 화면(SUNGWOO— CHOI / 최성우)을 그대로 옮긴 기본 공유 이미지
export default function Image() {
  const kr = "최성우";
  const { fonts, krFamily } = ogFonts(kr, [200]);

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
          <OgMark size={56} />
          <div style={{ display: "flex", fontSize: "24px", color: "#a3a3a3", fontWeight: 400 }}>
            {new URL(siteConfig.url).host}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: "168px",
            fontWeight: 300,
            letterSpacing: "-0.045em",
            lineHeight: 0.9,
          }}
        >
          <div style={{ display: "flex" }}>SUNGWOO—</div>
          <div style={{ display: "flex" }}>CHOI</div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", fontSize: "26px", fontWeight: 400 }}>developer / photographer / videographer</div>
          <div
            style={{
              display: "flex",
              fontFamily: krFamily,
              fontSize: "96px",
              fontWeight: 200,
              letterSpacing: "-0.05em",
              lineHeight: 1,
            }}
          >
            {kr}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts,
    }
  );
}
