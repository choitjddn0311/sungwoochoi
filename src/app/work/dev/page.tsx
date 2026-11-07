import type { Metadata } from "next";
import { siteConfig } from "@/lib/siteConfig";
import { getTranslations } from "next-intl/server";
import { FaGithub, FaExternalLinkAlt } from "react-icons/fa";
import Link from "next/link";
import projects from "@/data/projects.json";

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


const Projects = async () => {
  const t = await getTranslations("projects");

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
      </div>
    </div>
  );
};

export default Projects;
