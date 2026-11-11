"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Link } from "@/i18n/navigation";
import { useHydrated } from "@/lib/useHydrated";
import {
  deleteAction,
  previewAction,
  saveAction,
  uploadImageAction,
  type DeleteResult,
  type SaveResult,
} from "@/app/[locale]/write/actions";
import {
  SLUG_PATTERN,
  imagePublicPath,
  parseTags,
  postPath,
  suggestSlug,
  type PostFields,
} from "@/lib/write/post";

export type EditorInitial = {
  slug: string;
  fields: PostFields;
  body: string;
  originalPath: string | null;
  originalSha: string | null;
};

type PendingImage = { filename: string; url: string; size: number; sha: string | null; error?: string };
type Saved = { slug: string; title: string; date: string; summary: string; tags: string; body: string };
type Mode = "draft" | "publish";

const STORAGE_PREFIX = "write:";

type ToolId = "h2" | "h3" | "bold" | "link" | "quote" | "list" | "code" | "table" | "image";
const TOOLS: { id: ToolId; label: string; title: string }[] = [
  { id: "h2", label: "H2", title: "소제목" },
  { id: "h3", label: "H3", title: "작은 제목" },
  { id: "bold", label: "B", title: "굵게 (⌘B)" },
  { id: "link", label: "링크", title: "링크 (⌘K)" },
  { id: "quote", label: "인용", title: "인용" },
  { id: "list", label: "목록", title: "목록" },
  { id: "code", label: "{ }", title: "코드 블록" },
  { id: "table", label: "표", title: "표" },
  { id: "image", label: "사진", title: "사진 넣기" },
];

function readStore(key: string): Saved | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}
function writeStore(key: string, value: Saved | null) {
  try {
    if (value) localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    else localStorage.removeItem(STORAGE_PREFIX + key);
  } catch {
    // 저장소를 쓸 수 없는 브라우저에서는 자동 보관만 건너뛴다.
  }
}

// 긴 변 2000px, JPEG 85%로 줄인다. GIF는 움직임을 지키기 위해 그대로 둔다.
async function shrinkImage(file: File): Promise<{ blob: Blob; ext: string }> {
  if (file.type === "image/gif") return { blob: file, ext: "gif" };
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("사진을 변환하지 못했어요."))), "image/jpeg", 0.85),
  );
  return { blob, ext: "jpg" };
}

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function baseName(name: string) {
  const ascii = name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return ascii || "image";
}

function formatKb(bytes: number) {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)}MB` : `${Math.round(bytes / 1024)}KB`;
}

export default function Editor({ initial }: { initial: EditorInitial }) {
  const [original, setOriginal] = useState({ path: initial.originalPath, sha: initial.originalSha });
  const storeKey = initial.originalPath ?? "new";
  const isPublished = !!original.path && !original.path.includes("/drafts/");

  const [slug, setSlug] = useState(initial.slug);
  const [slugTouched, setSlugTouched] = useState(!!initial.slug);
  const [title, setTitle] = useState(initial.fields.title);
  const [date, setDate] = useState(initial.fields.date);
  const [summary, setSummary] = useState(initial.fields.summary);
  const [tags, setTags] = useState(initial.fields.tags.join(", "));
  const [body, setBody] = useState(initial.body);
  const [images, setImages] = useState<PendingImage[]>([]);

  const [tab, setTab] = useState<"write" | "preview">("write");
  // 휴대폰에서는 본문이 먼저 보이도록, 이미 있는 글이면 글 정보를 접어 둔다.
  const [metaOpen, setMetaOpen] = useState(!initial.slug);
  const [preview, setPreview] = useState<React.ReactNode>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewing, startPreview] = useTransition();

  const hydrated = useHydrated();
  const [restoreClosed, setRestoreClosed] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Mode | null>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<SaveResult | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // 삭제: 확인 → 지우는 중 → 결과
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState<DeleteResult | null>(null);

  const textRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const snapshot: Saved = useMemo(() => ({ slug, title, date, summary, tags, body }), [slug, title, date, summary, tags, body]);
  const initialSnapshot = useMemo<Saved>(
    () => ({
      slug: initial.slug,
      title: initial.fields.title,
      date: initial.fields.date,
      summary: initial.fields.summary,
      tags: initial.fields.tags.join(", "),
      body: initial.body,
    }),
    [initial],
  );
  const dirty = JSON.stringify(snapshot) !== JSON.stringify(initialSnapshot);

  // 이 기기에 보관된 내용이 있으면 불러올지 묻는다. 페이지를 연 시점의 보관본만 본다.
  const storedAtOpen = useMemo(() => (hydrated ? readStore(storeKey) : null), [hydrated, storeKey]);
  const restore =
    !restoreClosed && storedAtOpen && JSON.stringify(storedAtOpen) !== JSON.stringify(initialSnapshot) ? storedAtOpen : null;

  // 입력이 멈추면 이 기기에 자동 보관한다.
  useEffect(() => {
    if (!hydrated || restore || !dirty) return;
    const id = setTimeout(() => {
      writeStore(storeKey, snapshot);
      setSavedAt(new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }));
    }, 800);
    return () => clearTimeout(id);
  }, [snapshot, dirty, restore, storeKey, hydrated]);

  // 저장하지 않은 내용이 있으면 페이지를 떠날 때 경고한다.
  useEffect(() => {
    if (!dirty || result?.ok) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, result]);

  // 아직 저장하지 않은 사진은 브라우저에 있는 파일 주소로 바꿔서 미리보기에 보낸다.
  const previewSource = useMemo(
    () => images.reduce((text, image) => text.split(`(${imagePublicPath(slug, image.filename)})`).join(`(${image.url})`), body),
    [body, images, slug],
  );

  // 미리보기: 입력이 0.5초 멈추면 서버에서 실제 글과 같은 방식으로 그린다.
  useEffect(() => {
    const id = setTimeout(() => {
      startPreview(async () => {
        const rendered = await previewAction(previewSource);
        if (rendered.ok) {
          setPreview(rendered.content);
          setPreviewError(null);
        } else {
          setPreviewError(rendered.error);
        }
      });
    }, 500);
    return () => clearTimeout(id);
  }, [previewSource]);

  const changeTitle = (value: string) => {
    setTitle(value);
    if (!slugTouched && !original.path) setSlug(suggestSlug(value));
  };

  const changeSlug = (value: string) => {
    const next = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSlugTouched(true);
    // 본문에 넣어 둔 새 사진 경로도 새 주소로 바꾼다.
    if (images.length && slug) {
      setBody((current) => current.split(`/img/posts/${slug}/`).join(`/img/posts/${next}/`));
    }
    setSlug(next);
  };

  // 선택한 글자를 감싸거나 줄 앞에 기호를 붙인다.
  const edit = useCallback((make: (selected: string) => { text: string; select?: [number, number] }, linePrefix = false) => {
    const el = textRef.current;
    if (!el) return;
    let start = el.selectionStart;
    const end = el.selectionEnd;
    if (linePrefix) start = el.value.lastIndexOf("\n", start - 1) + 1;
    const selected = el.value.slice(start, end);
    const { text, select } = make(selected);
    const next = el.value.slice(0, start) + text + el.value.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      const [a, b] = select ?? [text.length, text.length];
      el.setSelectionRange(start + a, start + b);
    });
  }, []);

  const runTool = (id: ToolId) => {
    switch (id) {
      case "h2":
        return edit((s) => ({ text: `## ${s.replace(/^#+\s*/, "") || "소제목"}` }), true);
      case "h3":
        return edit((s) => ({ text: `### ${s.replace(/^#+\s*/, "") || "작은 제목"}` }), true);
      case "bold":
        return edit((s) => ({ text: `**${s || "굵게"}**`, select: [2, 2 + (s || "굵게").length] }));
      case "link":
        return edit((s) => ({ text: `[${s || "링크"}](https://)`, select: [(s || "링크").length + 3, (s || "링크").length + 11] }));
      case "quote":
        return edit((s) => ({ text: s.split("\n").map((l) => `> ${l}`).join("\n") || "> " }), true);
      case "list":
        return edit((s) => ({ text: s.split("\n").map((l) => `- ${l}`).join("\n") || "- " }), true);
      case "code":
        return edit((s) => ({ text: `\n\`\`\`js\n${s}\n\`\`\`\n`, select: [7, 7 + s.length] }));
      case "table":
        return edit(() => ({ text: "\n| 항목 | 내용 |\n|---|---|\n|  |  |\n" }));
      case "image":
        return fileRef.current?.click();
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(event.metaKey || event.ctrlKey)) return;
    const key = event.key.toLowerCase();
    if (key === "b") {
      event.preventDefault();
      runTool("bold");
    } else if (key === "k") {
      event.preventDefault();
      runTool("link");
    }
  };

  const addImages = async (files: File[]) => {
    const pictures = files.filter((file) => file.type.startsWith("image/"));
    if (!pictures.length) return;
    if (!SLUG_PATTERN.test(slug)) {
      setNotice("사진을 넣기 전에 주소(영문)를 먼저 정해 주세요. 사진이 그 주소 폴더에 저장돼요.");
      return;
    }
    setNotice(null);
    const taken = new Set(images.map((image) => image.filename));
    for (const file of pictures) {
      try {
        const { blob, ext } = await shrinkImage(file);
        let filename = `${baseName(file.name)}.${ext}`;
        for (let n = 2; taken.has(filename); n++) filename = `${baseName(file.name)}-${n}.${ext}`;
        taken.add(filename);
        const url = URL.createObjectURL(blob);
        setImages((list) => [...list, { filename, url, size: blob.size, sha: null }]);
        edit(() => ({ text: `\n![](${imagePublicPath(slug, filename)})\n`, select: [3, 3] }));
        const uploaded = await uploadImageAction(await toBase64(blob));
        setImages((list) =>
          list.map((image) =>
            image.filename === filename
              ? uploaded.ok
                ? { ...image, sha: uploaded.sha }
                : { ...image, error: uploaded.error }
              : image,
          ),
        );
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "사진을 넣지 못했어요.");
      }
    }
  };

  const fields = (): PostFields => ({ title: title.trim(), date, summary: summary.trim(), tags: parseTags(tags) });

  const problems = (mode: Mode): string[] => {
    const list: string[] = [];
    if (!title.trim()) list.push("제목을 입력해 주세요.");
    if (!SLUG_PATTERN.test(slug) || slug === "new") list.push("주소는 영문 소문자, 숫자, 하이픈(-)으로 정해 주세요. (new는 쓸 수 없어요)");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) list.push("날짜는 2026-11-08 형식으로 입력해 주세요.");
    if (mode === "publish" && !summary.trim()) list.push("발행하려면 요약을 입력해 주세요.");
    if (mode === "publish" && previewError) list.push("본문의 MDX 오류를 고쳐 주세요.");
    if (images.some((image) => !image.sha && !image.error)) list.push("사진을 올리는 중이에요. 잠시 뒤 다시 눌러 주세요.");
    if (images.some((image) => image.error)) list.push("올리지 못한 사진이 있어요. 본문에서 지우거나 다시 넣어 주세요.");
    return list;
  };

  const plannedFiles = (mode: Mode) => {
    const target = postPath(slug, mode === "draft");
    const list: { path: string; kind: "+" | "~" | "−" }[] = [{ path: target, kind: original.path === target ? "~" : "+" }];
    if (original.path && original.path !== target) list.push({ path: original.path, kind: "−" });
    images
      .filter((image) => image.sha && body.includes(imagePublicPath(slug, image.filename)))
      .forEach((image) => list.push({ path: `public${imagePublicPath(slug, image.filename)}`, kind: "+" }));
    return list;
  };

  const save = async (mode: Mode) => {
    setSaving(true);
    const response = await saveAction({
      mode,
      slug,
      fields: fields(),
      body,
      originalPath: original.path,
      originalSha: original.sha,
      images: images.filter((image) => image.sha).map((image) => ({ filename: image.filename, sha: image.sha! })),
    });
    setSaving(false);
    setConfirm(null);
    setResult(response);
    if (response.ok) {
      writeStore(storeKey, null);
      setOriginal({ path: response.path, sha: response.sha });
      setImages((list) => list.filter((image) => !body.includes(imagePublicPath(slug, image.filename))));
    }
  };

  const originalSlug = original.path?.split("/").pop()?.replace(/\.mdx$/, "") ?? "";

  const remove = async () => {
    if (!original.path || !original.sha) return;
    setDeleting(true);
    const response = await deleteAction({ path: original.path, sha: original.sha, title });
    setDeleting(false);
    setDeleteOpen(false);
    setDeleted(response);
    if (response.ok) writeStore(storeKey, null);
  };

  const problemList = confirm ? problems(confirm) : [];
  const showMeta = tags.trim() ? parseTags(tags).join(" / ") : "";

  return (
    <div className="pb-24">
      {/* 상단: 목록으로, 상태 */}
      <div className="wrap flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line py-2">
        <Link href="/write" className="tap tap-start meta text-muted transition-colors hover:text-foreground">
          ← 목록
        </Link>
        <span className="meta border border-line px-2 py-0.5 text-muted">
          {!original.path ? "새 글" : isPublished ? "발행된 글" : "임시저장"}
        </span>
        <span className="meta ml-auto text-muted" aria-live="polite">
          {savedAt ? `이 기기에 자동 보관됨 · ${savedAt}` : dirty ? "바뀐 내용 있음" : "저장된 상태"}
        </span>
      </div>

      {restore && (
        <div className="wrap" role="alert">
          <div className="mt-4 flex flex-wrap items-center gap-3 border border-foreground p-4 text-[15px]">
            <span>이 기기에 보관된, 저장하지 않은 내용이 있어요.</span>
            <button
              className="tap bg-foreground px-4 text-background"
              onClick={() => {
                setSlug(restore.slug);
                setSlugTouched(true);
                setTitle(restore.title);
                setDate(restore.date);
                setSummary(restore.summary);
                setTags(restore.tags);
                setBody(restore.body);
                setRestoreClosed(true);
              }}
            >
              불러오기
            </button>
            <button
              className="tap px-3 text-muted hover:text-foreground"
              onClick={() => {
                writeStore(storeKey, null);
                setRestoreClosed(true);
              }}
            >
              버리기
            </button>
          </div>
        </div>
      )}

      {/* 글 정보 */}
      <div className="wrap grid gap-4 pt-6">
        <input
          id="write-title"
          aria-label="제목"
          placeholder="제목"
          value={title}
          onChange={(e) => changeTitle(e.target.value)}
          className="w-full border-b border-line bg-transparent pb-3 font-kr text-[clamp(26px,3.4vw,44px)] font-light leading-tight outline-none placeholder:text-muted focus:border-foreground"
        />
        <button
          type="button"
          aria-expanded={metaOpen}
          onClick={() => setMetaOpen((open) => !open)}
          className="tap tap-start meta -mt-2 text-muted md:hidden"
        >
          {metaOpen ? "글 정보 접기 ↑" : `글 정보 펼치기 ↓ · ${slug || "주소 없음"}`}
        </button>
        <div className={`${metaOpen ? "grid" : "hidden"} gap-4 md:grid md:grid-cols-[2fr_1fr_1fr_1fr]`}>
          {[
            { id: "write-summary", label: "요약", value: summary, set: setSummary, hint: "글 목록과 공유 미리보기에 나와요", placeholder: "한두 문장" },
            { id: "write-tags", label: "태그", value: tags, set: setTags, hint: "쉼표로 구분", placeholder: "사진, 개발" },
            { id: "write-date", label: "날짜", value: date, set: setDate, hint: "2026-11-08 형식", placeholder: "2026-11-08" },
          ].map((field) => (
            <label key={field.id} htmlFor={field.id} className="grid min-w-0 gap-1">
              <span className="meta text-muted">{field.label}</span>
              <input
                id={field.id}
                value={field.value}
                placeholder={field.placeholder}
                onChange={(e) => field.set(e.target.value)}
                className="min-w-0 border-b border-line bg-transparent py-1.5 text-[15px] outline-none placeholder:text-muted focus:border-foreground"
              />
              <span className="meta text-muted">{field.hint}</span>
            </label>
          ))}
          <label htmlFor="write-slug" className="grid min-w-0 gap-1">
            <span className="meta text-muted">주소</span>
            <input
              id="write-slug"
              value={slug}
              placeholder="jeju-film"
              readOnly={isPublished}
              onChange={(e) => changeSlug(e.target.value)}
              className="min-w-0 border-b border-line bg-transparent py-1.5 font-mono text-[14px] outline-none placeholder:text-muted read-only:text-muted focus:border-foreground"
            />
            <span className="meta text-muted">{isPublished ? "발행된 글은 주소를 바꿀 수 없어요" : `/posts/${slug || "영문-주소"}`}</span>
          </label>
        </div>
      </div>

      {/* 모바일: 작성/미리보기 탭 */}
      <div className="wrap mt-5 lg:hidden">
        <div className="grid grid-cols-2 border-b border-line" role="tablist" aria-label="편집 화면">
          {(["write", "preview"] as const).map((id) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`tap text-[15px] ${tab === id ? "text-foreground shadow-[inset_0_-1px_0_var(--foreground)]" : "text-muted"}`}
            >
              {id === "write" ? "작성" : "미리보기"}
            </button>
          ))}
        </div>
      </div>

      <div className="wrap mt-0 lg:mt-6">
        <div className="grid border-line lg:grid-cols-2 lg:border-t">
          {/* 작성 */}
          <div className={`min-w-0 flex-col ${tab === "write" ? "flex" : "hidden"} lg:flex lg:border-r lg:border-line`}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line py-1 lg:pr-4">
              <div className="flex flex-wrap" aria-label="서식">
                {TOOLS.map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    title={tool.title}
                    onClick={() => runTool(tool.id)}
                    className="tap px-2 font-latin text-[14px] text-muted transition-colors hover:bg-surface hover:text-foreground"
                  >
                    {tool.label}
                  </button>
                ))}
              </div>
              <span className="meta hidden text-muted sm:inline">MDX</span>
            </div>
            <textarea
              ref={textRef}
              aria-label="본문"
              spellCheck={false}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={onKeyDown}
              onPaste={(e) => {
                const files = Array.from(e.clipboardData.files);
                if (files.length) {
                  e.preventDefault();
                  addImages(files);
                }
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const files = Array.from(e.dataTransfer.files);
                if (files.length) {
                  e.preventDefault();
                  addImages(files);
                }
              }}
              style={{ outlineOffset: -2 }}
              placeholder={"## 소제목\n\n본문을 MDX로 써요. 사진은 끌어다 놓거나 붙여넣을 수 있어요."}
              className="min-h-[60vh] w-full resize-y bg-transparent py-4 font-mono text-[14px] leading-[1.75] outline-none placeholder:text-muted lg:min-h-[640px] lg:pr-4"
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                addImages(Array.from(e.target.files ?? []));
                e.target.value = "";
              }}
            />
            <div className="meta flex flex-wrap items-center gap-2 border-t border-dashed border-line py-3 text-muted lg:pr-4">
              <span>사진은 끌어다 놓기, 붙여넣기, 사진 버튼으로 넣어요. 긴 변 2000px로 줄여서 올려요.</span>
              {images.map((image) => (
                <span key={image.filename} className={`border px-2 ${image.error ? "border-foreground text-foreground" : "border-line text-foreground"}`}>
                  {image.filename} · {formatKb(image.size)} · {image.error ? "실패" : image.sha ? "준비됨" : "올리는 중"}
                </span>
              ))}
            </div>
            {notice && (
              <p role="alert" className="meta pb-3 text-foreground">
                {notice}
              </p>
            )}
          </div>

          {/* 미리보기 */}
          <div className={`min-w-0 ${tab === "preview" ? "block" : "hidden"} lg:block lg:pl-8`}>
            <div className="meta flex justify-between border-b border-line py-3 text-muted">
              <span>미리보기 · 실제 글 화면</span>
              <span aria-live="polite">{previewing ? "그리는 중" : ""}</span>
            </div>
            <div className="max-w-[680px] py-6">
              <h1 className="article-title text-[clamp(32px,3.2vw,52px)]">{title || "제목"}</h1>
              <p className="meta mt-3 flex flex-wrap gap-x-3 text-muted">
                <time>{date}</time>
                {showMeta && <span>{showMeta}</span>}
              </p>
              {previewError ? (
                <div role="alert" className="mt-8 border border-foreground p-4">
                  <p className="text-[15px]">본문을 읽을 수 없는 부분이 있어요. 고치면 미리보기가 다시 나와요.</p>
                  <pre className="meta mt-2 whitespace-pre-wrap text-muted">{previewError}</pre>
                </div>
              ) : (
                <div className="article-body mt-8">
                  {preview}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 하단 고정: 저장 버튼 */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-background pb-[env(safe-area-inset-bottom,0px)]">
        <div className="wrap flex flex-wrap items-center justify-between gap-3 py-2.5">
          <span className="meta hidden text-muted md:inline">저장하면 GitHub에 커밋 하나가 올라가고 1~2분 뒤 사이트에 반영돼요.</span>
          <div className="ml-auto flex w-full gap-2 md:w-auto">
            {original.path && (
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="tap px-3 text-[15px] text-muted transition-colors hover:text-foreground"
              >
                삭제
              </button>
            )}
            <button
              type="button"
              aria-label="사진 넣기"
              onClick={() => fileRef.current?.click()}
              className="tap border border-line px-3 text-[18px] lg:hidden"
            >
              ＋
            </button>
            {!isPublished && (
              <button type="button" onClick={() => setConfirm("draft")} className="tap flex-1 border border-line px-5 text-[15px] md:flex-none">
                임시저장
              </button>
            )}
            <button type="button" onClick={() => setConfirm("publish")} className="tap flex-1 bg-foreground px-6 text-[15px] text-background md:flex-none">
              {isPublished ? "수정 발행" : "발행"}
            </button>
          </div>
        </div>
      </div>

      {/* 삭제 확인과 결과 */}
      {(deleteOpen || deleted) && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-background/80 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title">
          <div className="w-full max-w-[520px] border border-line bg-background p-6">
            {deleteOpen && (
              <>
                <p className="meta text-muted">삭제</p>
                <h2 id="delete-dialog-title" className="mt-2 font-kr text-[22px] font-normal">
                  이 글을 삭제할까요?
                </h2>
                <div className="mt-4 grid gap-1 overflow-x-auto bg-surface p-3 font-mono text-[12.5px]">
                  <span className="text-muted line-through">− {original.path}</span>
                  <span className="text-muted line-through">− public/img/posts/{originalSlug}/ (사진 폴더 전체)</span>
                </div>
                <p className="meta mt-3 text-muted">
                  {isPublished ? "공개된 글이 1~2분 뒤 사이트에서 사라져요. " : ""}커밋 하나로 지우고, 필요하면 GitHub 기록에서 되살릴 수 있어요.
                </p>
                <div className="mt-6 flex justify-end gap-2">
                  <button className="tap border border-line px-5" onClick={() => setDeleteOpen(false)} disabled={deleting}>
                    취소
                  </button>
                  <button className="tap bg-foreground px-6 text-background disabled:opacity-60" onClick={remove} disabled={deleting}>
                    {deleting ? "지우는 중…" : "삭제"}
                  </button>
                </div>
              </>
            )}

            {!deleteOpen && deleted && (
              <>
                <p className="meta text-muted">{deleted.ok ? "삭제" : "삭제하지 못했어요"}</p>
                <h2 id="delete-dialog-title" className="mt-2 font-kr text-[22px] font-normal">
                  {deleted.ok ? "글을 삭제했어요" : deleted.reason === "conflict" ? "저장소가 다른 곳에서 바뀌었어요" : "삭제하지 못했어요"}
                </h2>
                <p className="mt-3 text-[15px] text-muted">
                  {deleted.ok ? `파일 ${deleted.deleted.length}개를 지웠어요. 사이트에는 1~2분 뒤 반영돼요.` : deleted.error}
                </p>
                {deleted.ok && (
                  <a href={deleted.commitUrl} target="_blank" rel="noreferrer" className="meta mt-4 inline-block text-muted underline underline-offset-4">
                    GitHub 커밋 보기
                  </a>
                )}
                <div className="mt-6 flex justify-end gap-2">
                  {deleted.ok ? (
                    <Link href="/write" className="tap bg-foreground px-6 text-background">
                      목록으로
                    </Link>
                  ) : (
                    <>
                      {deleted.reason === "conflict" && (
                        <button className="tap border border-line px-5" onClick={() => window.location.reload()}>
                          최신 내용 불러오기
                        </button>
                      )}
                      <button className="tap bg-foreground px-6 text-background" onClick={() => setDeleted(null)}>
                        닫기
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 저장 확인과 결과 */}
      {(confirm || result) && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-background/80 p-4" role="dialog" aria-modal="true" aria-labelledby="write-dialog-title">
          <div className="w-full max-w-[520px] border border-line bg-background p-6">
            {confirm && (
              <>
                <p className="meta text-muted">{confirm === "draft" ? "임시저장" : isPublished ? "수정 발행" : "발행"}</p>
                {problemList.length ? (
                  <>
                    <h2 id="write-dialog-title" className="mt-2 font-kr text-[22px] font-normal">
                      저장하기 전에 확인해 주세요
                    </h2>
                    <ul className="mt-4 list-disc space-y-1 pl-5 text-[15px] text-muted">
                      {problemList.map((problem) => (
                        <li key={problem}>{problem}</li>
                      ))}
                    </ul>
                    <div className="mt-6 flex justify-end">
                      <button className="tap border border-line px-5" onClick={() => setConfirm(null)}>
                        돌아가기
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 id="write-dialog-title" className="mt-2 font-kr text-[22px] font-normal">
                      {confirm === "draft" ? "이 내용으로 임시저장할까요?" : "이 내용으로 발행할까요?"}
                    </h2>
                    <div className="mt-4 grid gap-1 overflow-x-auto bg-surface p-3 font-mono text-[12.5px]">
                      {plannedFiles(confirm).map((file) => (
                        <span key={file.path} className={file.kind === "−" ? "text-muted line-through" : ""}>
                          {file.kind} {file.path}
                        </span>
                      ))}
                    </div>
                    <p className="meta mt-3 text-muted">
                      {confirm === "draft"
                        ? "임시저장한 글은 공개 목록에 나오지 않아요. 다른 기기에서도 이어 쓸 수 있어요."
                        : "커밋 하나로 저장하고, 1~2분 뒤 사이트에 반영돼요."}
                    </p>
                    <div className="mt-6 flex justify-end gap-2">
                      <button className="tap border border-line px-5" onClick={() => setConfirm(null)} disabled={saving}>
                        취소
                      </button>
                      <button className="tap bg-foreground px-6 text-background disabled:opacity-60" onClick={() => save(confirm)} disabled={saving}>
                        {saving ? "저장하는 중…" : confirm === "draft" ? "임시저장" : "발행"}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {!confirm && result && (
              <>
                {result.ok ? (
                  <>
                    <p className="meta text-muted">{result.message}</p>
                    <h2 id="write-dialog-title" className="mt-2 font-kr text-[22px] font-normal">
                      {result.postUrl ? "저장했어요. 사이트에 반영하는 중이에요" : "임시저장했어요"}
                    </h2>
                    <p className="mt-3 text-[15px] text-muted">
                      {result.postUrl ? "보통 1~2분 걸려요. 반영되면 아래 주소에서 볼 수 있어요." : "글 목록의 임시저장에서 이어 쓸 수 있어요."}
                    </p>
                    <div className="mt-4 grid gap-1 text-[15px]">
                      {result.postUrl && (
                        <a href={result.postUrl} className="underline underline-offset-4">
                          {result.postUrl}
                        </a>
                      )}
                      <a href={result.commitUrl} target="_blank" rel="noreferrer" className="meta text-muted underline underline-offset-4">
                        GitHub 커밋 보기
                      </a>
                    </div>
                    <div className="mt-6 flex justify-end gap-2">
                      <Link href="/write" className="tap border border-line px-5">
                        목록으로
                      </Link>
                      <button className="tap bg-foreground px-6 text-background" onClick={() => setResult(null)}>
                        계속 쓰기
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="meta text-muted">저장하지 못했어요</p>
                    <h2 id="write-dialog-title" className="mt-2 font-kr text-[22px] font-normal">
                      {result.reason === "conflict" ? "저장소가 다른 곳에서 바뀌었어요" : "저장하지 못했어요"}
                    </h2>
                    <p className="mt-3 text-[15px] text-muted">{result.error}</p>
                    <div className="mt-6 flex justify-end gap-2">
                      {result.reason === "conflict" && (
                        <button className="tap border border-line px-5" onClick={() => window.location.reload()}>
                          최신 내용 불러오기
                        </button>
                      )}
                      <button className="tap bg-foreground px-6 text-background" onClick={() => setResult(null)}>
                        닫기
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
