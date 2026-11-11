"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import type { Photo, Video } from "@/lib/work";
import { getVideoThumbnail } from "@/lib/work";
import { uploadImageAction } from "@/app/[locale]/write/actions";
import { saveMediaAction, youtubeInfoAction, type MediaSaveResult } from "@/app/[locale]/write/media/actions";
import { readExif, shrinkImage, toBase64 } from "@/lib/write/image";
import {
  PHOTO_DIR,
  PHOTO_MAX_SIDE,
  REEL_DIR,
  REEL_THUMB_MAX_SIDE,
  checkPhoto,
  checkVideo,
  cleanPhoto,
  cleanVideo,
  mediaFilename,
  parseInstagramId,
  parseYoutubeId,
  publicPath,
} from "@/lib/write/media";

export type MediaInitial = {
  photos: Photo[];
  videos: Video[];
  base: { photos: string | null; videos: string | null };
  existing: string[];
};

type Props = { initial: MediaInitial | null; error: string | null; authExpired: boolean; login: string };
type Tab = "photo" | "video" | "reel";

// 고른 파일: 브라우저에서 줄여 곧바로 blob으로 올려 두고, 저장할 때 커밋에 넣는다.
type Upload = { url: string; sha: string | null; width: number; height: number; size: number; error?: string };

type PhotoDraft = { index: number | null; upload: Upload | null; photo: Photo };
type VideoDraft = { index: number | null; url: string; video: Video; loading?: boolean };
type ReelDraft = { index: number | null; url: string; upload: Upload | null; video: Video };

/** 투명한 1×1 GIF */
const BLANK_IMAGE = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

const inputClass =
  "min-w-0 w-full border-b border-line bg-transparent py-2 text-[16px] outline-none placeholder:text-muted focus:border-foreground";

const emptyPhoto = (): Photo => ({ src: "", alt: "", width: 0, height: 0 });

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={id} className="grid min-w-0 gap-1">
      <span className="flex justify-between gap-3">
        <span className="text-[13.5px]">{label}</span>
        {hint && <span className="meta text-muted">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function formatKb(bytes: number) {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)}MB` : `${Math.round(bytes / 1024)}KB`;
}

async function prepareUpload(file: File, maxSide: number): Promise<{ upload: Upload; finish: Promise<Upload> }> {
  const { blob, width, height } = await shrinkImage(file, maxSide);
  const upload: Upload = { url: URL.createObjectURL(blob), sha: null, width, height, size: blob.size };
  const finish = toBase64(blob)
    .then((base64) => uploadImageAction(base64))
    .then((result) => (result.ok ? { ...upload, sha: result.sha } : { ...upload, error: result.error }))
    .catch((error: unknown) => ({ ...upload, error: error instanceof Error ? error.message : "사진을 올리지 못했어요." }));
  return { upload, finish };
}

export default function MediaManager({ initial, error, authExpired, login }: Props) {
  const [base, setBase] = useState(initial?.base ?? { photos: null, videos: null });
  const [existing, setExisting] = useState(initial?.existing ?? []);
  const [saved, setSaved] = useState(() => ({
    photos: initial?.photos ?? [],
    films: (initial?.videos ?? []).filter((video) => video.provider !== "instagram"),
    reels: (initial?.videos ?? []).filter((video) => video.provider === "instagram"),
  }));
  const [photos, setPhotos] = useState(saved.photos);
  const [films, setFilms] = useState(saved.films);
  const [reels, setReels] = useState(saved.reels);
  // 저장소 경로 → 새로 올린 파일
  const [added, setAdded] = useState<Record<string, Upload>>({});
  // 저장한 뒤에도 배포 전까지는 사이트 주소에 파일이 없으므로 미리보기 주소를 남겨 둔다.
  const [previews, setPreviews] = useState<Record<string, string>>({});

  const [tab, setTab] = useState<Tab>("photo");
  const [photoDraft, setPhotoDraft] = useState<PhotoDraft | null>(null);
  const [videoDraft, setVideoDraft] = useState<VideoDraft | null>(null);
  const [reelDraft, setReelDraft] = useState<ReelDraft | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [exifFilled, setExifFilled] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<MediaSaveResult | null>(null);

  const changes = useMemo(() => {
    const list: string[] = [];
    const count = (now: unknown[], before: unknown[], label: string) => {
      if (JSON.stringify(now) === JSON.stringify(before)) return;
      const diff = now.length - before.length;
      list.push(diff > 0 ? `+ ${label} ${diff}` : diff < 0 ? `− ${label} ${-diff}` : `~ ${label} 정보·순서`);
    };
    count(photos, saved.photos, "사진");
    count(films, saved.films, "영상");
    count(reels, saved.reels, "릴스");
    return list;
  }, [photos, films, reels, saved]);
  const dirty = changes.length > 0;

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const takenNames = (dir: string) =>
    new Set([...existing, ...Object.keys(added)].filter((path) => path.startsWith(`${dir}/`)).map((path) => path.split("/").pop()!));

  const previewOf = (src: string) => {
    const entry = Object.entries(added).find(([path]) => publicPath(path) === src);
    return entry ? entry[1].url : (previews[src] ?? src);
  };

  const move = <T,>(list: T[], set: (next: T[]) => void, index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= list.length) return;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    set(next);
  };

  const closeForms = () => {
    setPhotoDraft(null);
    setVideoDraft(null);
    setReelDraft(null);
    setFormError(null);
    setExifFilled([]);
  };

  const openNew = () => {
    closeForms();
    if (tab === "photo") setPhotoDraft({ index: null, upload: null, photo: emptyPhoto() });
    if (tab === "video") setVideoDraft({ index: null, url: "", video: { provider: "youtube", id: "", title: "" } });
    if (tab === "reel") setReelDraft({ index: null, url: "", upload: null, video: { provider: "instagram", id: "", title: "" } });
  };

  // ---------- 사진 ----------
  const pickPhoto = async (file: File | undefined) => {
    if (!file || !photoDraft) return;
    setFormError(null);
    try {
      const exif = await readExif(file);
      const { upload, finish } = await prepareUpload(file, PHOTO_MAX_SIDE);
      setPhotoDraft((draft) =>
        draft && {
          ...draft,
          upload,
          photo: {
            ...draft.photo,
            date: draft.photo.date || exif.date,
            camera: draft.photo.camera || exif.camera,
            lens: draft.photo.lens || exif.lens,
            width: upload.width,
            height: upload.height,
          },
        },
      );
      setExifFilled((Object.keys(exif) as string[]).filter((key) => exif[key as keyof typeof exif]));
      const done = await finish;
      setPhotoDraft((draft) => (draft && draft.upload?.url === upload.url ? { ...draft, upload: done } : draft));
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "사진을 읽지 못했어요. 다른 사진으로 시도해 주세요.");
    }
  };

  const confirmPhoto = () => {
    if (!photoDraft) return;
    const { upload, index } = photoDraft;
    let photo = cleanPhoto(photoDraft.photo);
    if (index === null) {
      if (!upload) return setFormError("사진을 골라 주세요.");
      if (upload.error) return setFormError(upload.error);
      if (!upload.sha) return setFormError("사진을 올리는 중이에요. 잠시 뒤 다시 눌러 주세요.");
      const path = `${PHOTO_DIR}/${mediaFilename(photo.date ?? "", photo.title ?? "", takenNames(PHOTO_DIR))}`;
      photo = { ...photo, src: publicPath(path) };
      const problem = checkPhoto(photo);
      if (problem) return setFormError(problem);
      setAdded((map) => ({ ...map, [path]: upload }));
      setPhotos((list) => [...list, photo]);
    } else {
      const problem = checkPhoto(photo);
      if (problem) return setFormError(problem);
      setPhotos((list) => list.map((item, i) => (i === index ? photo : item)));
    }
    closeForms();
  };

  // ---------- 영상 ----------
  const lookupVideo = async (url: string) => {
    const id = parseYoutubeId(url);
    if (!id) {
      setFormError(url.trim() ? "유튜브 영상 주소를 넣어 주세요. 예: https://youtu.be/…" : null);
      // 주소가 틀리거나 비면 이전 영상을 지운다. 그대로 두면 옛 썸네일이 보이고 옛 영상이 저장된다.
      setVideoDraft((draft) => draft && { ...draft, video: { ...draft.video, id: "" } });
      return;
    }
    setFormError(null);
    setVideoDraft((draft) => draft && { ...draft, loading: true, video: { ...draft.video, id, vertical: id === draft.video.id ? draft.video.vertical : url.includes("/shorts/") } });
    const info = await youtubeInfoAction(url);
    setVideoDraft((draft) => draft && { ...draft, loading: false, video: { ...draft.video, title: draft.video.title || info?.title || "" } });
  };

  const confirmVideo = () => {
    if (!videoDraft) return;
    if (!videoDraft.video.id) return setFormError("유튜브 영상 주소를 넣어 주세요.");
    const video = cleanVideo(videoDraft.video);
    const problem = checkVideo(video);
    if (problem) return setFormError(problem);
    const { index } = videoDraft;
    if (films.some((item, i) => i !== index && item.id === video.id)) return setFormError("이미 목록에 있는 영상이에요.");
    setFilms((list) => (index === null ? [...list, video] : list.map((item, i) => (i === index ? video : item))));
    closeForms();
  };

  // ---------- 릴스 ----------
  const pickReelThumb = async (file: File | undefined) => {
    if (!file || !reelDraft) return;
    setFormError(null);
    try {
      const { upload, finish } = await prepareUpload(file, REEL_THUMB_MAX_SIDE);
      setReelDraft((draft) => draft && { ...draft, upload });
      const done = await finish;
      setReelDraft((draft) => (draft && draft.upload?.url === upload.url ? { ...draft, upload: done } : draft));
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "사진을 읽지 못했어요.");
    }
  };

  const confirmReel = () => {
    if (!reelDraft) return;
    const id = parseInstagramId(reelDraft.url);
    if (!id) return setFormError("릴스 주소를 넣어 주세요. 예: https://www.instagram.com/reel/…");
    if (reels.some((item, i) => i !== reelDraft.index && item.id === id)) return setFormError("이미 목록에 있는 릴스예요.");
    let video: Video = cleanVideo({ ...reelDraft.video, provider: "instagram", id });
    const { upload, index } = reelDraft;
    if (upload) {
      if (upload.error) return setFormError(upload.error);
      if (!upload.sha) return setFormError("썸네일을 올리는 중이에요. 잠시 뒤 다시 눌러 주세요.");
      const path = `${REEL_DIR}/${mediaFilename(video.date ?? "", video.title, takenNames(REEL_DIR))}`;
      video = { ...video, thumbnail: publicPath(path) };
      const problem = checkVideo(video);
      if (problem) return setFormError(problem);
      setAdded((map) => ({ ...map, [path]: upload }));
    } else {
      const problem = checkVideo(video);
      if (problem) return setFormError(problem);
    }
    setReels((list) => (index === null ? [...list, video] : list.map((item, i) => (i === index ? video : item))));
    closeForms();
  };

  // ---------- 저장 ----------
  const revert = () => {
    setPhotos(saved.photos);
    setFilms(saved.films);
    setReels(saved.reels);
    setAdded({});
    closeForms();
  };

  const save = async () => {
    setSaving(true);
    const response = await saveMediaAction({
      photos,
      videos: [...films, ...reels],
      added: Object.entries(added)
        .filter(([, upload]) => upload.sha)
        .map(([path, upload]) => ({ path, sha: upload.sha! })),
      base,
      existing,
    });
    setSaving(false);
    setResult(response);
    if (response.ok) {
      setBase(response.base);
      setExisting(response.existing);
      setSaved({ photos, films, reels });
      setPreviews((map) => ({ ...map, ...Object.fromEntries(Object.entries(added).map(([path, upload]) => [publicPath(path), upload.url])) }));
      setAdded({});
    }
  };

  // ---------- 화면 ----------
  const tabs: { id: Tab; label: string; count: number; add: string }[] = [
    { id: "photo", label: "사진", count: photos.length, add: "사진 추가" },
    { id: "video", label: "영상", count: films.length, add: "영상 추가" },
    { id: "reel", label: "릴스", count: reels.length, add: "릴스 추가" },
  ];
  const current = tabs.find((item) => item.id === tab)!;
  const formOpen = !!(photoDraft || videoDraft || reelDraft);

  const rowActions = (onUp: () => void, onDown: () => void, onEdit: () => void, onDelete: () => void, first: boolean, last: boolean) => (
    <div className="flex items-center justify-end">
      <button type="button" className="tap text-muted hover:text-foreground disabled:opacity-30" aria-label="위로" onClick={onUp} disabled={first}>
        ↑
      </button>
      <button type="button" className="tap text-muted hover:text-foreground disabled:opacity-30" aria-label="아래로" onClick={onDown} disabled={last}>
        ↓
      </button>
      <button type="button" className="tap px-2 text-[15px] text-muted hover:text-foreground" onClick={onEdit}>
        수정
      </button>
      <button type="button" className="tap px-2 text-[15px] text-muted hover:text-foreground" onClick={onDelete}>
        삭제
      </button>
    </div>
  );

  // 저장했지만 아직 배포되지 않은 파일처럼 그림을 못 읽으면 깨진 아이콘 대신 회색 칸을 보인다.
  const blankOnError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (e.currentTarget.src !== BLANK_IMAGE) e.currentTarget.src = BLANK_IMAGE;
  };

  const thumb = (src: string | null, ratio: number) => (
    <span className="grid h-[56px] w-[56px] place-items-center sm:h-[72px] sm:w-[72px]">
      {src ? (
        // 저장 전 사진은 브라우저 안의 임시 주소라 next/image를 쓰지 않는다.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className={`bg-surface object-cover grayscale ${ratio < 1 ? "h-full w-auto" : "h-auto w-full"}`}
          style={{ aspectRatio: String(ratio) }}
          onError={blankOnError}
        />
      ) : (
        <span className="block h-full w-full bg-surface" />
      )}
    </span>
  );

  return (
    <div className="wrap pb-32 pt-[clamp(24px,5vw,64px)]">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <h1 className="display text-[clamp(56px,calc(var(--u)*9),150px)]">Media</h1>
        <div className="flex items-center gap-3">
          <Link href="/write" className="tap meta px-2 text-muted transition-colors hover:text-foreground">
            글 쓰기 →
          </Link>
          <form action="/api/write/logout" method="post">
            <button type="submit" className="tap meta px-2 text-muted transition-colors hover:text-foreground">
              로그아웃 · {login}
            </button>
          </form>
        </div>
      </div>

      {authExpired && (
        <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-4 border border-line p-4 text-[15px]">
          <p className="text-muted">GitHub 로그인이 만료됐어요. 로그아웃한 뒤 다시 로그인해 주세요.</p>
          <form action="/api/write/logout" method="post">
            <button type="submit" className="tap bg-foreground px-5 text-background">
              로그아웃
            </button>
          </form>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-4 border border-line p-4 text-[15px] text-muted">
          {error}
        </p>
      )}

      {initial && (
        <>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 py-3">
            <div className="flex gap-5" role="tablist" aria-label="작품 종류">
              {tabs.map((item) => (
                <button
                  key={item.id}
                  role="tab"
                  aria-selected={tab === item.id}
                  onClick={() => {
                    setTab(item.id);
                    closeForms();
                  }}
                  className={`tap tap-start text-[15px] ${tab === item.id ? "text-foreground underline underline-offset-[6px]" : "text-muted"}`}
                >
                  {item.label} {String(item.count).padStart(2, "0")}
                </button>
              ))}
            </div>
            {!formOpen && (
              <button type="button" onClick={openNew} className="tap ml-auto bg-foreground px-5 text-[15px] text-background">
                {current.add}
              </button>
            )}
          </div>

          {/* 사진 추가·수정 */}
          {photoDraft && (
            <section aria-label={photoDraft.index === null ? "사진 추가" : "사진 수정"} className="grid gap-8 border-y border-line py-6 md:grid-cols-[5fr_7fr]">
              <div className="grid content-start gap-3">
                {photoDraft.index === null && !photoDraft.upload ? (
                  <label className="grid aspect-[4/5] cursor-pointer place-items-center border border-dashed border-muted p-6 text-center">
                    <span>
                      사진을 눌러서 고르세요
                      <span className="meta mt-1 block text-muted">휴대폰에서는 사진 보관함·카메라에서 바로 골라요</span>
                    </span>
                    <input type="file" accept="image/*" className="sr-only" onChange={(e) => pickPhoto(e.target.files?.[0])} />
                  </label>
                ) : (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoDraft.upload?.url ?? previewOf(photoDraft.photo.src)}
                      alt=""
                      className="w-full bg-surface"
                      style={{ aspectRatio: `${photoDraft.photo.width} / ${photoDraft.photo.height}` }}
                    />
                    <p className="meta text-muted">
                      {photoDraft.photo.width} × {photoDraft.photo.height}
                      {photoDraft.upload &&
                        ` · ${formatKb(photoDraft.upload.size)} · ${photoDraft.upload.error ? "올리지 못함" : photoDraft.upload.sha ? "올림" : "올리는 중…"}`}
                    </p>
                    {photoDraft.index === null && (
                      <label className="tap w-fit cursor-pointer border border-line px-5 text-[15px]">
                        다른 사진 고르기
                        <input type="file" accept="image/*" className="sr-only" onChange={(e) => pickPhoto(e.target.files?.[0])} />
                      </label>
                    )}
                  </>
                )}
                <p className="meta text-muted">긴 변 {PHOTO_MAX_SIDE}px로 줄여 올려요. 원본은 올리지 않아요.</p>
              </div>
              <div className="grid content-start gap-5">
                <Field id="media-title" label="제목">
                  <input id="media-title" className={inputClass} value={photoDraft.photo.title ?? ""} onChange={(e) => setPhotoDraft({ ...photoDraft, photo: { ...photoDraft.photo, title: e.target.value } })} />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field id="media-date" label="찍은 날" hint={exifFilled.includes("date") ? "사진 정보에서 채움" : undefined}>
                    <input id="media-date" type="date" className={inputClass} value={photoDraft.photo.date ?? ""} onChange={(e) => setPhotoDraft({ ...photoDraft, photo: { ...photoDraft.photo, date: e.target.value } })} />
                  </Field>
                  <Field id="media-place" label="장소">
                    <input id="media-place" className={inputClass} value={photoDraft.photo.place ?? ""} onChange={(e) => setPhotoDraft({ ...photoDraft, photo: { ...photoDraft.photo, place: e.target.value } })} />
                  </Field>
                  <Field id="media-camera" label="카메라" hint={exifFilled.includes("camera") ? "사진 정보에서 채움" : undefined}>
                    <input id="media-camera" className={inputClass} placeholder="예: Sony A7 II" value={photoDraft.photo.camera ?? ""} onChange={(e) => setPhotoDraft({ ...photoDraft, photo: { ...photoDraft.photo, camera: e.target.value } })} />
                  </Field>
                  <Field id="media-lens" label="렌즈" hint={exifFilled.includes("lens") ? "사진 정보에서 채움" : undefined}>
                    <input id="media-lens" className={inputClass} value={photoDraft.photo.lens ?? ""} onChange={(e) => setPhotoDraft({ ...photoDraft, photo: { ...photoDraft.photo, lens: e.target.value } })} />
                  </Field>
                </div>
                <Field id="media-series" label="시리즈" hint="선택">
                  <input id="media-series" className={inputClass} placeholder="예: 흑백 첫 롤" value={photoDraft.photo.series ?? ""} onChange={(e) => setPhotoDraft({ ...photoDraft, photo: { ...photoDraft.photo, series: e.target.value } })} />
                </Field>
                <Field id="media-ig" label="인스타그램 게시물 주소" hint="선택 · @chooi.film">
                  <input id="media-ig" type="url" className={inputClass} placeholder="https://www.instagram.com/p/…" value={photoDraft.photo.instagram ?? ""} onChange={(e) => setPhotoDraft({ ...photoDraft, photo: { ...photoDraft.photo, instagram: e.target.value } })} />
                </Field>
                <Field id="media-alt" label="사진 설명" hint="화면을 못 보는 사람에게 읽어 줘요">
                  <textarea id="media-alt" rows={2} className={`${inputClass} resize-y`} value={photoDraft.photo.alt} onChange={(e) => setPhotoDraft({ ...photoDraft, photo: { ...photoDraft.photo, alt: e.target.value } })} />
                </Field>
                <FormFoot error={formError} onCancel={closeForms} onConfirm={confirmPhoto} confirmLabel={photoDraft.index === null ? "목록에 넣기" : "고치기"} />
              </div>
            </section>
          )}

          {/* 영상 추가·수정 */}
          {videoDraft && (
            <section aria-label="영상" className="grid gap-8 border-y border-line py-6 md:grid-cols-[5fr_7fr]">
              <div className="grid content-start gap-3">
                {/* 유튜브 썸네일은 위아래 검은 띠가 있는 4:3 그림이다. 칸 비율을 고정하고 그림을 칸에 맞춰 잘라야 띠와 칸 늘어남이 없다. */}
                <div
                  className={`relative grid place-items-center overflow-hidden bg-surface ${videoDraft.video.vertical ? "mx-auto aspect-[9/16] w-[60%]" : "aspect-video w-full"}`}
                >
                  {videoDraft.video.id && getVideoThumbnail(videoDraft.video) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getVideoThumbnail(videoDraft.video)!}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                      onError={blankOnError}
                    />
                  ) : (
                    <span className="meta text-muted">유튜브 썸네일 자동</span>
                  )}
                </div>
                <div className="flex w-fit border border-line" role="group" aria-label="화면 방향">
                  {[false, true].map((vertical) => (
                    <button
                      key={String(vertical)}
                      type="button"
                      aria-pressed={!!videoDraft.video.vertical === vertical}
                      onClick={() => setVideoDraft({ ...videoDraft, video: { ...videoDraft.video, vertical } })}
                      className={`tap px-4 text-[14px] ${!!videoDraft.video.vertical === vertical ? "bg-foreground text-background" : "text-muted"}`}
                    >
                      {vertical ? "세로(쇼츠)" : "가로"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid content-start gap-5">
                <Field id="media-yt" label="유튜브 주소" hint={videoDraft.loading ? "제목 가져오는 중…" : undefined}>
                  <input
                    id="media-yt"
                    type="url"
                    className={inputClass}
                    placeholder="https://youtu.be/…"
                    value={videoDraft.url}
                    onChange={(e) => setVideoDraft({ ...videoDraft, url: e.target.value })}
                    onBlur={(e) => lookupVideo(e.target.value)}
                  />
                </Field>
                <Field id="media-vtitle" label="제목" hint="유튜브 제목을 가져와요. 고쳐도 돼요">
                  <input id="media-vtitle" className={inputClass} value={videoDraft.video.title} onChange={(e) => setVideoDraft({ ...videoDraft, video: { ...videoDraft.video, title: e.target.value } })} />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field id="media-vdate" label="날짜">
                    <input id="media-vdate" type="date" className={inputClass} value={videoDraft.video.date ?? ""} onChange={(e) => setVideoDraft({ ...videoDraft, video: { ...videoDraft.video, date: e.target.value } })} />
                  </Field>
                  <Field id="media-vrole" label="맡은 일" hint="선택">
                    <input id="media-vrole" className={inputClass} placeholder="예: 촬영, 편집" value={videoDraft.video.role ?? ""} onChange={(e) => setVideoDraft({ ...videoDraft, video: { ...videoDraft.video, role: e.target.value } })} />
                  </Field>
                </div>
                <FormFoot error={formError} onCancel={closeForms} onConfirm={confirmVideo} confirmLabel={videoDraft.index === null ? "목록에 넣기" : "고치기"} />
              </div>
            </section>
          )}

          {/* 릴스 추가·수정 */}
          {reelDraft && (
            <section aria-label="릴스" className="grid gap-8 border-y border-line py-6 md:grid-cols-[5fr_7fr]">
              <div className="grid content-start gap-3">
                <label className="relative mx-auto grid aspect-[9/16] w-[60%] cursor-pointer place-items-center overflow-hidden border border-dashed border-muted text-center">
                  {reelDraft.upload || reelDraft.video.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={reelDraft.upload?.url ?? previewOf(reelDraft.video.thumbnail!)}
                      alt=""
                      className="absolute inset-0 h-full w-full bg-surface object-cover"
                      onError={blankOnError}
                    />
                  ) : (
                    <span className="p-4 text-[15px]">썸네일 고르기</span>
                  )}
                  <input type="file" accept="image/*" className="sr-only" onChange={(e) => {
                      pickReelThumb(e.target.files?.[0]);
                      // 같은 파일을 다시 골라도(올리기 실패 뒤 재시도) 다시 읽게 비운다.
                      e.target.value = "";
                    }} />
                </label>
                <p className="meta text-muted">
                  인스타그램은 썸네일을 가져올 수 없어 직접 골라요(화면 캡처나 표지 사진). 눌러서 바꿀 수 있어요.
                  {reelDraft.upload && ` ${reelDraft.upload.error ? "올리지 못함" : reelDraft.upload.sha ? "올림" : "올리는 중…"}`}
                </p>
              </div>
              <div className="grid content-start gap-5">
                <Field id="media-reel" label="릴스 주소">
                  <input id="media-reel" type="url" className={inputClass} placeholder="https://www.instagram.com/reel/…" value={reelDraft.url} onChange={(e) => setReelDraft({ ...reelDraft, url: e.target.value })} />
                </Field>
                <Field id="media-rtitle" label="제목">
                  <input id="media-rtitle" className={inputClass} value={reelDraft.video.title} onChange={(e) => setReelDraft({ ...reelDraft, video: { ...reelDraft.video, title: e.target.value } })} />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field id="media-rdate" label="날짜">
                    <input id="media-rdate" type="date" className={inputClass} value={reelDraft.video.date ?? ""} onChange={(e) => setReelDraft({ ...reelDraft, video: { ...reelDraft.video, date: e.target.value } })} />
                  </Field>
                  <Field id="media-rrole" label="맡은 일" hint="선택">
                    <input id="media-rrole" className={inputClass} placeholder="예: 촬영, 편집" value={reelDraft.video.role ?? ""} onChange={(e) => setReelDraft({ ...reelDraft, video: { ...reelDraft.video, role: e.target.value } })} />
                  </Field>
                </div>
                <p className="meta text-muted">영상 페이지에 세로 칸으로 나오고, 누르면 인스타그램에서 열려요.</p>
                <FormFoot error={formError} onCancel={closeForms} onConfirm={confirmReel} confirmLabel={reelDraft.index === null ? "목록에 넣기" : "고치기"} />
              </div>
            </section>
          )}

          {/* 목록 */}
          <ul>
            {tab === "photo" &&
              photos.map((photo, index) => (
                <li key={photo.src} className="grid grid-cols-[56px_minmax(0,1fr)] items-center gap-x-4 gap-y-1 border-b border-line py-3 sm:grid-cols-[28px_72px_minmax(0,1fr)_auto]">
                  <span className="meta hidden tabular-nums text-muted sm:inline">{String(index + 1).padStart(2, "0")}</span>
                  {thumb(previewOf(photo.src), photo.width / photo.height)}
                  <div className="min-w-0">
                    <p className="font-kr text-[clamp(17px,1.8vw,22px)] font-light">{photo.title || photo.src.split("/").pop()}</p>
                    <p className="meta flex flex-wrap gap-x-3 text-muted">
                      {photo.date && <span>{photo.date}</span>}
                      {photo.place && <span>{photo.place}</span>}
                      {photo.camera ? <span>{[photo.camera, photo.lens].filter(Boolean).join(" · ")}</span> : <span className="text-foreground">카메라 없음</span>}
                      {photo.instagram && <span>Instagram</span>}
                    </p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    {rowActions(
                      () => move(photos, setPhotos, index, -1),
                      () => move(photos, setPhotos, index, 1),
                      () => {
                        closeForms();
                        setPhotoDraft({ index, upload: null, photo });
                      },
                      () => setPhotos(photos.filter((_, i) => i !== index)),
                      index === 0,
                      index === photos.length - 1,
                    )}
                  </div>
                </li>
              ))}
            {tab === "video" &&
              films.map((video, index) => (
                <li key={`${video.provider}-${video.id}`} className="grid grid-cols-[56px_minmax(0,1fr)] items-center gap-x-4 gap-y-1 border-b border-line py-3 sm:grid-cols-[28px_72px_minmax(0,1fr)_auto]">
                  <span className="meta hidden tabular-nums text-muted sm:inline">{String(index + 1).padStart(2, "0")}</span>
                  {thumb(getVideoThumbnail(video), video.vertical ? 9 / 16 : 16 / 9)}
                  <div className="min-w-0">
                    <p className="font-kr text-[clamp(17px,1.8vw,22px)] font-light">{video.title}</p>
                    <p className="meta flex flex-wrap gap-x-3 text-muted">
                      <span>{video.vertical ? "세로" : "가로"}</span>
                      {video.date && <span>{video.date}</span>}
                      {video.role && <span>{video.role}</span>}
                    </p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    {rowActions(
                      () => move(films, setFilms, index, -1),
                      () => move(films, setFilms, index, 1),
                      () => {
                        closeForms();
                        setVideoDraft({ index, url: `https://youtu.be/${video.id}`, video });
                      },
                      () => setFilms(films.filter((_, i) => i !== index)),
                      index === 0,
                      index === films.length - 1,
                    )}
                  </div>
                </li>
              ))}
            {tab === "reel" &&
              reels.map((video, index) => (
                <li key={video.id} className="grid grid-cols-[56px_minmax(0,1fr)] items-center gap-x-4 gap-y-1 border-b border-line py-3 sm:grid-cols-[28px_72px_minmax(0,1fr)_auto]">
                  <span className="meta hidden tabular-nums text-muted sm:inline">{String(index + 1).padStart(2, "0")}</span>
                  {thumb(video.thumbnail ? previewOf(video.thumbnail) : null, 9 / 16)}
                  <div className="min-w-0">
                    <p className="font-kr text-[clamp(17px,1.8vw,22px)] font-light">{video.title}</p>
                    <p className="meta flex flex-wrap gap-x-3 text-muted">
                      {video.date && <span>{video.date}</span>}
                      {video.role && <span>{video.role}</span>}
                    </p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    {rowActions(
                      () => move(reels, setReels, index, -1),
                      () => move(reels, setReels, index, 1),
                      () => {
                        closeForms();
                        setReelDraft({ index, url: `https://www.instagram.com/reel/${video.id}/`, upload: null, video });
                      },
                      () => setReels(reels.filter((_, i) => i !== index)),
                      index === 0,
                      index === reels.length - 1,
                    )}
                  </div>
                </li>
              ))}
          </ul>
          {current.count === 0 && !formOpen && <p className="py-8 text-[15px] text-muted">아직 없어요. 오른쪽 위 &ldquo;{current.add}&rdquo;로 넣어 주세요.</p>}
          <p className="meta pt-4 text-muted">
            {tab === "photo"
              ? "순서는 사진 페이지에 나오는 순서와 같아요. 위 두 장은 홈 띠에도 나와요. 목록에서 지운 사진 파일은 저장할 때 함께 지워져요."
              : tab === "video"
                ? "순서는 영상 페이지에 나오는 순서와 같아요. 릴스는 영상 다음에 나와요."
                : "릴스는 영상 페이지에서 영상 다음에 세로 칸으로 나와요."}
          </p>

          {/* 하단 저장 막대 */}
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-background pb-[env(safe-area-inset-bottom,0px)]">
            <div className="wrap flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2.5">
              <p className="meta flex flex-wrap gap-x-3 text-muted" aria-live="polite">
                {dirty ? (
                  <>
                    <span className="text-foreground">바뀐 것 {changes.length}건</span>
                    {changes.map((change) => (
                      <span key={change}>{change}</span>
                    ))}
                  </>
                ) : (
                  <span>저장된 상태 · 저장하면 커밋 하나로 올라가고 1~2분 뒤 사이트에 반영돼요</span>
                )}
              </p>
              <div className="ml-auto flex gap-2">
                <button type="button" onClick={revert} disabled={!dirty || saving} className="tap border border-line px-5 text-[15px] disabled:opacity-40">
                  되돌리기
                </button>
                <button type="button" onClick={save} disabled={!dirty || saving || formOpen} className="tap bg-foreground px-6 text-[15px] text-background disabled:opacity-40">
                  {saving ? "저장하는 중…" : "저장하기"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {result && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-background/80 p-4" role="dialog" aria-modal="true" aria-labelledby="media-dialog-title">
          <div className="w-full max-w-[520px] border border-line bg-background p-6">
            <p className="meta text-muted">{result.ok ? "저장" : "저장하지 못했어요"}</p>
            <h2 id="media-dialog-title" className="mt-2 font-kr text-[22px] font-normal">
              {result.ok ? "저장했어요. 사이트에 반영하는 중이에요" : result.reason === "conflict" ? "저장소가 다른 곳에서 바뀌었어요" : "저장하지 못했어요"}
            </h2>
            <p className="mt-3 text-[15px] text-muted">{result.ok ? `${result.summary}. 보통 1~2분 걸려요.` : result.error}</p>
            {result.ok && (
              <a href={result.commitUrl} target="_blank" rel="noreferrer" className="meta mt-4 inline-block text-muted underline underline-offset-4">
                GitHub 커밋 보기
              </a>
            )}
            <div className="mt-6 flex justify-end gap-2">
              {!result.ok && result.reason === "conflict" && (
                <button className="tap border border-line px-5" onClick={() => window.location.reload()}>
                  새로 불러오기
                </button>
              )}
              <button className="tap bg-foreground px-6 text-background" onClick={() => setResult(null)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormFoot({
  error,
  onCancel,
  onConfirm,
  confirmLabel,
}: {
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel: string;
}) {
  return (
    <div className="grid gap-3 border-t border-line pt-4">
      {error && (
        <p role="alert" className="text-[14px]">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" className="tap border border-line px-5 text-[15px]" onClick={onCancel}>
          취소
        </button>
        <button type="button" className="tap bg-foreground px-6 text-[15px] text-background" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}

