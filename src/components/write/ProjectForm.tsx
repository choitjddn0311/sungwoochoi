"use client";

import { useState } from "react";
import { repoInfoAction } from "@/app/[locale]/write/work/actions";
import { Field, FormFoot, inputClass } from "@/components/write/fields";
import { checkProject, cleanProject, formatPeriod, parsePeriod, type ProjectEntry } from "@/lib/write/projects";

type Props = {
  project: ProjectEntry | null;
  onCancel: () => void;
  /** 목록에 넣는다. 넣을 수 없으면 이유를 돌려준다. */
  onConfirm: (project: ProjectEntry) => string | null;
};

type Draft = {
  title: string;
  title_en: string;
  start: string;
  end: string;
  ongoing: boolean;
  description: string;
  description_en: string;
  techs: string[];
  github: string;
  url: string;
};

const toDraft = (project: ProjectEntry | null): Draft => {
  const period = parsePeriod(project?.period ?? "");
  return {
    title: project?.title ?? "",
    title_en: project?.title_en ?? "",
    ...period,
    description: project?.description ?? "",
    description_en: project?.description_en ?? "",
    techs: project?.techs ?? [],
    github: project?.github ?? "",
    url: project?.url ?? "",
  };
};

// 불러오기로 채운 칸은 옅은 배경으로 표시한다.
const filledClass = "bg-surface px-2";

export default function ProjectForm({ project, onCancel, onConfirm }: Props) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(project));
  const [techInput, setTechInput] = useState("");
  const [filled, setFilled] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setFilled((list) => list.filter((item) => item !== key));
  };
  const mark = (key: keyof Draft) => (filled.includes(key) ? filledClass : "");

  const addTech = () => {
    const names = techInput.split(",").map((name) => name.trim()).filter(Boolean);
    if (names.length) set("techs", [...new Set([...draft.techs, ...names])]);
    setTechInput("");
  };

  const importRepo = async () => {
    if (!draft.github.trim()) return setError("GitHub 저장소 주소를 넣어 주세요. 예: https://github.com/choitjddn0311/…");
    setError(null);
    setLoading(true);
    const info = await repoInfoAction(draft.github).catch(() => null);
    setLoading(false);
    if (!info) return setError("저장소 정보를 읽지 못했어요. 주소를 확인하거나 직접 입력해 주세요.");
    // 이미 적어 둔 칸은 덮어쓰지 않는다.
    const next: Partial<Draft> = {};
    if (!draft.title && info.title) next.title = info.title;
    if (!draft.description && info.description) next.description = info.description;
    if (!draft.start && info.start) next.start = info.start;
    if (!draft.techs.length && info.techs.length) next.techs = info.techs;
    if (!draft.url && info.url) next.url = info.url;
    setDraft((d) => ({ ...d, ...next }));
    setFilled(Object.keys(next));
    if (!Object.keys(next).length) setError("채울 빈 칸이 없어요. 이미 적은 내용은 그대로 뒀어요.");
  };

  const result = (): ProjectEntry =>
    cleanProject({
      title: draft.title,
      title_en: draft.title_en,
      period: formatPeriod(draft),
      description: draft.description,
      description_en: draft.description_en,
      techs: techInput.trim() ? [...draft.techs, ...techInput.split(",")] : draft.techs,
      github: draft.github,
      url: draft.url,
    });

  const confirm = () => {
    const entry = result();
    const problem = checkProject(entry) ?? onConfirm(entry);
    if (problem) setError(problem);
  };

  const preview = result();

  return (
    <section aria-label={project ? "프로젝트 수정" : "프로젝트 추가"} className="grid gap-8 border-y border-line py-6 md:grid-cols-[5fr_7fr]">
      {/* /work/dev 한 줄과 같은 모양의 미리보기 */}
      <div className="order-2 grid content-start gap-3 md:order-none">
        <p className="meta text-muted">개발 페이지 미리보기</p>
        <div className="grid gap-3 border-t border-foreground pt-4">
          <p className="meta text-muted">{preview.period || "시작 달을 입력해 주세요"}</p>
          <p className="project-title">{preview.title || "프로젝트 이름"}</p>
          <p className="leading-[1.75]">{preview.description || <span className="text-muted">설명이 여기에 보여요.</span>}</p>
          {preview.techs.length > 0 && <p className="meta text-muted">{preview.techs.join(" / ")}</p>}
          <p className="meta flex gap-4">
            {preview.github && <span className="underline underline-offset-4">GitHub</span>}
            {preview.url && <span className="underline underline-offset-4">데모</span>}
          </p>
        </div>
        <p className="meta text-muted">영어 이름·설명을 비우면 영어 페이지에도 한국어로 보여요.</p>
      </div>

      <div className="grid content-start gap-5">
        <Field id="project-github" label="GitHub 주소" hint="선택">
          <span className="flex items-end gap-2">
            <input
              id="project-github"
              type="url"
              className={inputClass}
              placeholder="https://github.com/choitjddn0311/…"
              value={draft.github}
              onChange={(e) => set("github", e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  importRepo();
                }
              }}
            />
            <button type="button" className="tap shrink-0 border border-line px-4 text-[15px] disabled:opacity-40" onClick={importRepo} disabled={loading}>
              {loading ? "읽는 중…" : "불러오기"}
            </button>
          </span>
        </Field>
        <p className="meta -mt-3 text-muted">불러오기는 저장소 이름·소개·언어·만든 달을 빈 칸에 채워요. 채운 칸은 회색으로 보여요.</p>

        <Field id="project-title" label="이름">
          <input id="project-title" className={`${inputClass} ${mark("title")}`} value={draft.title} onChange={(e) => set("title", e.target.value)} />
        </Field>
        <Field id="project-title-en" label="영어 이름" hint="선택">
          <input id="project-title-en" className={inputClass} value={draft.title_en} onChange={(e) => set("title_en", e.target.value)} />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="project-start" label="시작" hint="2026.09">
            <input id="project-start" inputMode="decimal" className={`${inputClass} ${mark("start")}`} placeholder="2026.09" value={draft.start} onChange={(e) => set("start", e.target.value)} />
          </Field>
          <div className="grid min-w-0 gap-1">
            <span className="flex justify-between gap-3">
              <label htmlFor="project-end" className="text-[13.5px]">
                끝
              </label>
              <label className="meta flex cursor-pointer items-center gap-1.5 text-muted">
                <input type="checkbox" checked={draft.ongoing} onChange={(e) => set("ongoing", e.target.checked)} />
                개발 중
              </label>
            </span>
            <input
              id="project-end"
              inputMode="decimal"
              className={`${inputClass} disabled:opacity-40`}
              placeholder={draft.ongoing ? "개발 중" : "같은 달이면 비워 두기"}
              value={draft.ongoing ? "" : draft.end}
              disabled={draft.ongoing}
              onChange={(e) => set("end", e.target.value)}
            />
          </div>
        </div>

        <Field id="project-desc" label="설명">
          <textarea id="project-desc" rows={3} className={`${inputClass} resize-y ${mark("description")}`} value={draft.description} onChange={(e) => set("description", e.target.value)} />
        </Field>
        <Field id="project-desc-en" label="영어 설명" hint="선택">
          <textarea id="project-desc-en" rows={2} className={`${inputClass} resize-y`} value={draft.description_en} onChange={(e) => set("description_en", e.target.value)} />
        </Field>

        <Field id="project-tech" label="기술" hint="Enter로 추가">
          <span className={`flex flex-wrap items-center gap-1.5 border-b border-line py-1.5 focus-within:border-foreground ${mark("techs")}`}>
            {draft.techs.map((tech) => (
              <span key={tech} className="meta inline-flex items-center gap-1 border border-line px-2 py-0.5 normal-case">
                {tech}
                <button type="button" aria-label={`${tech} 빼기`} className="text-muted hover:text-foreground" onClick={() => set("techs", draft.techs.filter((item) => item !== tech))}>
                  ×
                </button>
              </span>
            ))}
            <input
              id="project-tech"
              className="min-w-[8ch] flex-1 bg-transparent py-1 text-[16px] outline-none placeholder:text-muted"
              placeholder={draft.techs.length ? "" : "예: Next.js"}
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTech();
                }
                if (e.key === "Backspace" && !techInput && draft.techs.length) set("techs", draft.techs.slice(0, -1));
              }}
              onBlur={addTech}
            />
          </span>
        </Field>

        <Field id="project-url" label="배포 주소" hint="선택">
          <input id="project-url" type="url" className={`${inputClass} ${mark("url")}`} placeholder="https://…" value={draft.url} onChange={(e) => set("url", e.target.value)} />
        </Field>

        <FormFoot error={error} onCancel={onCancel} onConfirm={confirm} confirmLabel={project ? "고치기" : "목록에 넣기"} />
      </div>
    </section>
  );
}
