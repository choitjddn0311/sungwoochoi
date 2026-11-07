import type { Metadata } from "next";
import { siteConfig } from "@/lib/siteConfig";
import { getTranslations } from "next-intl/server";
import { FaGithub, FaExternalLinkAlt } from "react-icons/fa";
import Link from "next/link";
import projects from "@/data/projects.json";
import StackCard from "@/components/common/stackCard";
import { FaCss3Alt, FaDocker, FaHtml5, FaJava, FaJs, FaLinux, FaNodeJs, FaPhp, FaReact, FaUbuntu } from "react-icons/fa";
import { GrOracle } from "react-icons/gr";
import { SiMysql } from "react-icons/si";

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


// 스택을 추가하려면 아래 배열에 넣는다. 구조: 스텍명, 아이콘, 아이콘 색상
const FrontStack = [
  { stack: "html", icon: <FaHtml5 />, iconColor: "text-foreground" },
  { stack: "css", icon: <FaCss3Alt />, iconColor: "text-foreground" },
  { stack: "js", icon: <FaJs />, iconColor: "text-foreground" },
  { stack: "react", icon: <FaReact />, iconColor: "text-foreground" },
];
const BackStack = [
  { stack: "php", icon: <FaPhp />, iconColor: "text-foreground" },
  { stack: "nodejs", icon: <FaNodeJs />, iconColor: "text-foreground" },
  { stack: "jsp", icon: <FaJava />, iconColor: "text-foreground" },
];
const DbStack = [
  { stack: "oracle", icon: <GrOracle />, iconColor: "text-foreground" },
  { stack: "mysql", icon: <SiMysql />, iconColor: "text-foreground" },
];
const ServerStack = [
  { stack: "linux", icon: <FaLinux />, iconColor: "text-foreground" },
  { stack: "ubuntu", icon: <FaUbuntu />, iconColor: "text-foreground" },
  { stack: "docker", icon: <FaDocker />, iconColor: "text-foreground" },
];
// 대회명, 직종, 수상명은 messages/{ko,en}.json의 home.awardItems.{key}에 작성한다.
const AwardRecord = [
  { year: "2025", key: "progate2025" },
  { year: "2025", key: "national2025" },
  { year: "2025", key: "incheon2025" },
  { year: "2024", key: "incheon2024" },
];
// 자격증명은 messages/{ko,en}.json의 home.licenseItems.{key}에 작성한다.
const License = [
  { getDate: "2025.06.05", key: "webDesign" },
  { getDate: "2025.03.19", key: "infoProcessing" },
  { getDate: "2025.01.06", key: "programming" },
];

const Projects = async () => {
  const t = await getTranslations("projects");
  const h = await getTranslations("home");

  return (
    <div className="w-full flex justify-center bg-background text-foreground">
      <div className="w-full sm:w-150 md:w-200 lg:w-250 xl:w-300 2xl:w-300 py-20 px-5 xl:px-0 min-h-165">
        <h1 className="text-2xl 2xl:text-4xl xl:text-4xl lg:text-3xl md:text-3xl sm:text-2xl font-bold mb-10">
          Projects
        </h1>

        {projects.length === 0 ? (
          <p className="text-foreground/50">{t("noProjects")}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <article
                key={index}
                className="flex flex-col gap-4 p-5 rounded-xl border border-foreground/10 hover:border-cyan-400/50 transition-colors"
              >
                <div className="flex flex-col gap-1">
                  <h2 className="text-base xl:text-lg font-bold leading-snug">{project.title}</h2>
                  <time className="text-xs text-foreground/40">{project.period}</time>
                </div>

                <p className="text-sm text-foreground/70 leading-relaxed flex-1">
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {project.techs.map((tech) => (
                    <span
                      key={tech}
                      className="text-xs px-2 py-1 rounded-full bg-cyan-400/10 text-cyan-500"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                <div className="flex gap-3 pt-1 border-t border-foreground/10">
                  {project.github && (
                    <Link
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-foreground/50 hover:text-cyan-500 transition-colors"
                    >
                      <FaGithub className="text-sm" />
                      {t("github")}
                    </Link>
                  )}
                  {project.url && (
                    <Link
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-foreground/50 hover:text-cyan-500 transition-colors"
                    >
                      <FaExternalLinkAlt className="text-xs" />
                      {t("demo")}
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {/* 4단계에서 시안 디자인으로 다듬는다 */}
        <h2 className="meta text-muted pt-20 pb-4">{h("stackTitle")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <StackCard title="frontend" items={FrontStack} />
          <StackCard title="backend" items={BackStack} />
          <StackCard title="database" items={DbStack} />
          <StackCard title="server" items={ServerStack} />
        </div>
        <h2 className="meta text-muted pt-20 pb-4">{h("awards")}</h2>
        <ul>
          {AwardRecord.map((item) => (
            <li key={item.key} className="flex flex-wrap gap-x-4 border-t border-line py-3">
              <span className="text-muted">{item.year}</span>
              <span>{h(`awardItems.${item.key}.contest`)}</span>
              <span>{h(`awardItems.${item.key}.award`)}</span>
            </li>
          ))}
        </ul>
        <h2 className="meta text-muted pt-20 pb-4">{h("licenses")}</h2>
        <ul>
          {License.map((item) => (
            <li key={item.key} className="flex flex-wrap gap-x-4 border-t border-line py-3">
              <span className="text-muted">{item.getDate}</span>
              <span>{h(`licenseItems.${item.key}`)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Projects;
