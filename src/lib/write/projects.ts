// 개발 작업(프로젝트) 등록 규칙. 등록 화면과 서버가 함께 쓰므로 Node 전용 모듈을 넣지 않는다.

export const PROJECTS_PATH = "src/data/projects.json";

/** projects.json 한 항목. 선택 칸은 비어 있으면 저장하지 않는다. */
export interface ProjectEntry {
  title: string;
  title_en?: string;
  /** "2026.02 ~ 개발중", "2026.05 ~ 2026.06", "2026.06" 중 하나 */
  period: string;
  description: string;
  description_en?: string;
  techs: string[];
  github?: string;
  url?: string;
}

/** 진행 중인 프로젝트의 끝 표시. 영어 페이지에서는 localizeProject가 바꿔 보여 준다. */
export const ONGOING = "개발중";

const MONTH = /^\d{4}\.(0[1-9]|1[0-2])$/;

export type Period = { start: string; end: string; ongoing: boolean };

export function parsePeriod(period: string): Period {
  const [start = "", end = ""] = period.split("~").map((part) => part.trim());
  if (end === ONGOING) return { start, end: "", ongoing: true };
  return { start, end, ongoing: false };
}

export function formatPeriod({ start, end, ongoing }: Period) {
  const from = start.trim();
  const to = end.trim();
  if (ongoing) return `${from} ~ ${ONGOING}`;
  if (!to || to === from) return from;
  return `${from} ~ ${to}`;
}

/** "2026-09-14T…"(GitHub 날짜) 같은 값을 "2026.09"로 */
export function monthOf(date: string) {
  const match = date.match(/^(\d{4})-(\d{2})/);
  return match ? `${match[1]}.${match[2]}` : "";
}

/** github.com/소유자/저장소 주소에서 소유자와 저장소 이름을 꺼낸다. */
export function parseRepo(url: string): { owner: string; repo: string } | null {
  const match = url.trim().match(/^https:\/\/(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?(?:[?#].*)?$/);
  return match ? { owner: match[1], repo: match[2] } : null;
}

const isHttps = (value: string) => {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

export function checkProject(project: ProjectEntry): string | null {
  const name = project.title?.trim() || "이름 없는 프로젝트";
  if (!project.title?.trim()) return "프로젝트 이름을 입력해 주세요.";
  if (!project.description?.trim()) return `설명을 입력해 주세요. (${name})`;
  if (project.title.length > 120 || (project.title_en ?? "").length > 120) return `이름이 너무 길어요. (${name})`;
  if (project.description.length > 600 || (project.description_en ?? "").length > 600) return `설명이 너무 길어요. (${name})`;
  const { start, end, ongoing } = parsePeriod(project.period ?? "");
  if (!MONTH.test(start)) return `시작은 2026.09 형식으로 입력해 주세요. (${name})`;
  if (!ongoing && end && !MONTH.test(end)) return `끝은 2026.10 형식으로 입력해 주세요. (${name})`;
  if (!ongoing && end && end < start) return `끝이 시작보다 빨라요. (${name})`;
  if (!Array.isArray(project.techs) || project.techs.some((tech) => typeof tech !== "string" || tech.length > 40)) return `기술 목록이 올바르지 않아요. (${name})`;
  if (project.github && !parseRepo(project.github)) return `GitHub 주소가 올바르지 않아요. (${name})`;
  if (project.url && !isHttps(project.url)) return `배포 주소는 https://로 시작해야 해요. (${name})`;
  return null;
}

/** 저장할 때 빈 칸은 지우고, 키 순서를 기존 파일과 같게 맞춘다. */
export function cleanProject(project: ProjectEntry): ProjectEntry {
  const techs = [...new Set((project.techs ?? []).map((tech) => tech.trim()).filter(Boolean))];
  const order: (keyof ProjectEntry)[] = ["title", "title_en", "period", "description", "description_en", "techs", "github", "url"];
  return Object.fromEntries(
    order
      .map((key) => [key, key === "techs" ? techs : typeof project[key] === "string" ? (project[key] as string).trim() : project[key]])
      .filter(([, value]) => value !== undefined && value !== ""),
  ) as unknown as ProjectEntry;
}

/** 지금 파일처럼 기술 목록은 한 줄로 둔다. */
export function serializeProjects(list: ProjectEntry[]) {
  const json = JSON.stringify(list, null, 2).replace(/"techs": \[([^\]]*)\]/g, (_, inner: string) => {
    const items = JSON.parse(`[${inner}]`) as string[];
    return `"techs": [${items.map((item) => JSON.stringify(item)).join(", ")}]`;
  });
  return `${json}\n`;
}
