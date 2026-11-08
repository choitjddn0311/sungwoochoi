import { readFileSync } from "fs";
import { join } from "path";

// 공유 이미지(app/opengraph-image.tsx, app/posts/[slug]/opengraph-image.tsx)가 함께 쓰는 글꼴과 마크.
// 글꼴은 사이트와 같은 @fontsource 패키지에서 읽는다. 빌드 때 웹에서 받아 오지 않는다.

type Weight = 200 | 300 | 400;
type OgFont = { name: string; data: Buffer; weight: Weight; style: "normal" };

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_LATIN = "Inter Tight";
export const OG_KR = "Noto Sans KR";

// 공유 이미지는 모두 빌드 때 만들어지므로 글꼴 파일을 서버 함수에 넣을 필요가 없다.
// turbopackIgnore가 없으면 @fontsource 파일 1만여 개가 함수 크기에 포함된다.
const fontsource = (pkg: string) => join(/* turbopackIgnore: true */ process.cwd(), "node_modules/@fontsource", pkg);

function interTight(weight: 300 | 400): OgFont {
  const data = readFileSync(join(fontsource("inter-tight"), `files/inter-tight-latin-${weight}-normal.woff`));
  return { name: OG_LATIN, data, weight, style: "normal" };
}

// Noto Sans KR은 글자 범위별로 120여 개 파일로 나뉘어 있다.
// 패키지 CSS의 unicode-range를 읽어 text에 쓰인 글자가 들어 있는 파일만 고른다.
function notoSansKR(weight: Weight, text: string): OgFont[] {
  const dir = fontsource("noto-sans-kr");
  const css = readFileSync(join(dir, `${weight}.css`), "utf8");
  const codes = new Set([...text].map((ch) => ch.codePointAt(0)!));

  const fonts: OgFont[] = [];
  for (const block of css.split("@font-face").slice(1)) {
    const file = block.match(/url\(\.\/(files\/[^)]+\.woff)\)/)?.[1];
    const range = block.match(/unicode-range:\s*([^;]+);/)?.[1];
    if (!file || !range) continue;

    const covers = range.split(",").some((part) => {
      const [start, end] = part.trim().replace(/^U\+/i, "").split("-");
      const lo = parseInt(start, 16);
      const hi = end ? parseInt(end, 16) : lo;
      for (const c of codes) if (c >= lo && c <= hi) return true;
      return false;
    });
    if (covers) fonts.push({ name: OG_KR, data: readFileSync(join(dir, file)), weight, style: "normal" });
  }
  return fonts;
}

/** 이미지에 들어가는 글자(krText)에 맞춰 Inter Tight 300·400과 Noto Sans KR을 불러온다. */
export function ogFonts(krText: string, krWeights: Weight[]): OgFont[] {
  return [interTight(300), interTight(400), ...krWeights.flatMap((w) => notoSansKR(w, krText))];
}

/** 파비콘(src/favicon.svg)의 뷰파인더 슬래시. 배경 사각형은 이미지 배경이 검정이라 뺐다. */
export function OgMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <path d="M9 24V9H24M40 9H55V24M55 40V55H40M24 55H9V40" fill="none" stroke="#ffffff" strokeWidth={6} />
      <path d="M41 20L23 44" fill="none" stroke="#ffffff" strokeWidth={6} />
    </svg>
  );
}
