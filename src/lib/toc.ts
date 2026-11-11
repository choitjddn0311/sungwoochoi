export type TocItem = {
  id: string;
  text: string;
  level: number;
};

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-가-힣]/g, "");
}

/** 제목 줄의 마크다운 꾸밈(링크, 강조, 코드)을 벗겨 화면에 보이는 글자만 남긴다. */
function plainText(markdown: string): string {
  return markdown
    .replace(/\s+#+\s*$/, "") // 닫는 # (## 제목 ##)
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .trim();
}

export function extractToc(content: string): TocItem[] {
  const items: TocItem[] = [];
  // 코드 블록(``` 또는 ~~~) 안의 "# 주석"은 제목이 아니다. 여는 울타리와 같은 문자로 같거나 더 길게 닫혀야 끝난다.
  let fence: string | null = null;

  for (const line of content.split("\n")) {
    const fenceMatch = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      if (fence === null) fence = marker;
      else if (marker[0] === fence[0] && marker.length >= fence.length && line.trim() === marker) fence = null;
      continue;
    }
    if (fence !== null) continue;

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (!heading) continue;
    const text = plainText(heading[2]);
    if (text) items.push({ id: slugify(text), text, level: heading[1].length });
  }

  return items;
}
