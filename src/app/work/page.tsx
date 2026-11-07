import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { siteConfig } from "@/lib/siteConfig";
import { padCount, photos, projects, videos } from "@/lib/work";

export const metadata: Metadata = {
  title: "Work",
  description: "최성우의 개발, 사진, 영상 작업입니다.",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: siteConfig.name,
    title: `Work | ${siteConfig.name}`,
    description: "최성우의 개발, 사진, 영상 작업입니다.",
    url: `${siteConfig.url}/work`,
  },
};

const Work = async () => {
  const t = await getTranslations("work");
  const rows = [
    { href: "/work/dev", label: t("dev"), count: projects.length },
    { href: "/work/photo", label: t("photo"), count: photos.length },
    { href: "/work/film", label: t("film"), count: videos.length },
  ];

  return (
    <div className="wrap py-16">
      <h1 className="display text-[clamp(50px,13vw,180px)] pb-10">WORK</h1>
      <ul>
        {rows.map((row) => (
          <li key={row.href} className="border-t border-line">
            <Link href={row.href} className="invert-row flex items-baseline justify-between gap-4 py-4">
              <span className="display-kr text-[clamp(40px,9vw,124px)]">{row.label}</span>
              <span className="display text-[clamp(40px,9vw,124px)]">{padCount(row.count)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Work;
