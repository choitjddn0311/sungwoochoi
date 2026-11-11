// 편집기와 작품 등록 화면이 함께 쓰는 사진 처리. 브라우저에서만 쓴다.

/** 긴 변을 maxSide 이하로, JPEG 85%로 줄인다. GIF는 움직임을 지키기 위해 그대로 둔다. */
export async function shrinkImage(
  file: File,
  maxSide: number,
): Promise<{ blob: Blob; ext: string; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  if (file.type === "image/gif") {
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return { blob: file, ext: "gif", ...size };
  }
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("사진을 변환하지 못했어요."))), "image/jpeg", 0.85),
  );
  return { blob, ext: "jpg", width: canvas.width, height: canvas.height };
}

export function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export type PhotoExif = { camera?: string; lens?: string; date?: string };

/**
 * JPEG의 촬영 정보(EXIF)에서 카메라, 렌즈, 찍은 날을 읽는다.
 * 줄이면 정보가 사라지므로 원본 파일에서 읽는다. 없거나 읽지 못하면 빈 객체.
 */
export async function readExif(file: File): Promise<PhotoExif> {
  try {
    const view = new DataView(await file.slice(0, 256 * 1024).arrayBuffer());
    if (view.getUint16(0) !== 0xffd8) return {};
    let offset = 2;
    while (offset + 4 < view.byteLength) {
      const marker = view.getUint16(offset);
      const size = view.getUint16(offset + 2);
      // APP1 + "Exif\0\0"
      if (marker === 0xffe1 && view.getUint32(offset + 4) === 0x45786966) return parseTiff(view, offset + 10);
      if ((marker & 0xff00) !== 0xff00) return {};
      offset += 2 + size;
    }
  } catch {
    // 형식이 다른 파일은 정보 없이 넘어간다.
  }
  return {};
}

function parseTiff(view: DataView, start: number): PhotoExif {
  const little = view.getUint16(start) === 0x4949;
  const u16 = (at: number) => view.getUint16(start + at, little);
  const u32 = (at: number) => view.getUint32(start + at, little);

  const readIfd = (at: number) => {
    const tags = new Map<number, string | number>();
    const count = u16(at);
    for (let i = 0; i < count; i++) {
      const entry = at + 2 + i * 12;
      const tag = u16(entry);
      const type = u16(entry + 2);
      const length = u32(entry + 4);
      if (type === 2) {
        const dataAt = length > 4 ? u32(entry + 8) : entry + 8;
        let text = "";
        for (let k = 0; k < length - 1; k++) text += String.fromCharCode(view.getUint8(start + dataAt + k));
        tags.set(tag, text.replace(/\0+$/, "").trim());
      } else if (type === 4) {
        tags.set(tag, u32(entry + 8));
      }
    }
    return tags;
  };

  const ifd0 = readIfd(u32(4));
  const exifAt = ifd0.get(0x8769);
  const exif = typeof exifAt === "number" ? readIfd(exifAt) : new Map<number, string | number>();

  const make = String(ifd0.get(0x010f) ?? "");
  const model = String(ifd0.get(0x0110) ?? "");
  // 모델 이름에 제조사가 이미 들어 있으면(예: "Canon EOS R6") 한 번만 쓴다.
  const camera = model.toLowerCase().startsWith(make.toLowerCase().split(" ")[0]) ? model : [make, model].filter(Boolean).join(" ");
  const lens = String(exif.get(0xa434) ?? "");
  const taken = String(exif.get(0x9003) ?? "");
  const date = /^\d{4}:\d{2}:\d{2}/.test(taken) ? taken.slice(0, 10).replaceAll(":", "-") : "";

  return { ...(camera && { camera }), ...(lens && { lens }), ...(date && { date }) };
}
