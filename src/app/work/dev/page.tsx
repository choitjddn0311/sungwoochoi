import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import SectionFooter from "@/components/common/SectionFooter";
import StackCard from "@/components/common/stackCard";
import { siteConfig } from "@/lib/siteConfig";
import { projects } from "@/lib/work";

export const metadata: Metadata = {
  title: "Development",
  description: "최성우가 진행한 개발 프로젝트 목록입니다.",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: siteConfig.name,
    title: `Development | ${siteConfig.name}`,
    description: "최성우가 진행한 개발 프로젝트 목록입니다.",
    url: `${siteConfig.url}/work/dev`,
  },
};

// 스택을 추가하려면 해당 분야의 items에 이름을 넣는다.
const STACKS = [
  { title: "frontend", items: ["html", "css", "js", "react"] },
  { title: "backend", items: ["php", "nodejs", "jsp"] },
  { title: "database", items: ["oracle", "mysql"] },
  { title: "server", items: ["linux", "ubuntu", "docker"] },
];

// 대회명, 직종, 수상명은 messages/{ko,en}.json의 home.awardItems.{key}에 작성한다.
const AWARDS = [
  { year: "2025", key: "progate2025" },
  { year: "2025", key: "national2025" },
  { year: "2025", key: "incheon2025" },
  { year: "2024", key: "incheon2024" },
];

// 자격증명은 messages/{ko,en}.json의 home.licenseItems.{key}에 작성한다.
const LICENSES = [
  { date: "2025.06.05", key: "webDesign" },
  { date: "2025.03.19", key: "infoProcessing" },
  { date: "2025.01.06", key: "programming" },
];

const LINK = "underline underline-offset-4 hover:no-underline";

const Development = async () => {
  const t = await getTranslations("projects");
  const w = await getTranslations("work");
  const h = await getTranslations("home");

  return (
    <>
      <h1 className="sr-only">{w("dev")}</h1>
      <div className="gap-m" />

      <div className="wrap">
        {projects.length === 0 && <p className="text-muted">{t("noProjects")}</p>}
        {projects.map((project) => (
          <article
            key={project.title}
            className="grid grid-cols-1 gap-x-8 gap-y-3.5 border-t border-line py-[clamp(20px,3vw,36px)] min-[681px]:grid-cols-[7fr_5fr]"
          >
            <div>
              <p className="meta pb-2 text-muted">{project.period}</p>
              <h2 className="project-title">{project.title}</h2>
            </div>
            <div className="flex flex-col gap-2.5">
              <p className="leading-[1.75]">{project.description}</p>
              <p className="meta text-muted">{project.techs.join(" / ")}</p>
              <div className="meta flex gap-4">
                {project.github && (
                  <Link href={project.github} target="_blank" rel="noopener noreferrer" className={LINK}>
                    {t("github")}
                  </Link>
                )}
                {project.url && (
                  <Link href={project.url} target="_blank" rel="noopener noreferrer" className={LINK}>
                    {t("demo")}
                  </Link>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
      <SectionFooter count={projects.length} label="PROJECTS" />

      <div className="gap-l" />
      <section aria-labelledby="stack-title" className="wrap">
        <h2 id="stack-title" className="meta pb-6 text-muted">{h("stackTitle")}</h2>
        <div className="grid grid-cols-2 gap-6 min-[681px]:grid-cols-4">
          {STACKS.map((stack) => (
            <StackCard key={stack.title} title={stack.title} items={stack.items} />
          ))}
        </div>
      </section>

      <div className="gap-l" />
      <section aria-labelledby="awards-title" className="wrap">
        <h2 id="awards-title" className="meta pb-3.5 text-muted">{h("awards")}</h2>
        <ul>
          {AWARDS.map((award) => {
            const category = h(`awardItems.${award.key}.category`);
            return (
              <li
                key={award.key}
                className="grid grid-cols-[4em_minmax(0,1fr)] gap-x-4 gap-y-1 border-t border-line py-3 min-[681px]:grid-cols-[5em_minmax(0,1fr)_auto]"
              >
                <span className="text-muted">{award.year}</span>
                <span>
                  {h(`awardItems.${award.key}.contest`)}
                  {category && <span className="text-muted"> · {category}</span>}
                </span>
                <span className="col-start-2 min-[681px]:col-start-3">{h(`awardItems.${award.key}.award`)}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="gap-m" />
      <section aria-labelledby="licenses-title" className="wrap">
        <h2 id="licenses-title" className="meta pb-3.5 text-muted">{h("licenses")}</h2>
        <ul>
          {LICENSES.map((license) => (
            <li
              key={license.key}
              className="grid grid-cols-[6.5em_minmax(0,1fr)] gap-x-4 border-t border-line py-3"
            >
              <span className="text-muted tabular-nums">{license.date}</span>
              <span>{h(`licenseItems.${license.key}`)}</span>
            </li>
          ))}
        </ul>
      </section>
      <div className="gap-l" />
    </>
  );
};

export default Development;
