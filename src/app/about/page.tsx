import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { siteConfig } from "@/lib/siteConfig";
import { getTranslations } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description: "개발하고, 사진과 영상을 찍는 최성우를 소개합니다.",
  path: "/about",
});

const HASH_TAGS = ["developer", "photographer", "videographer", "travel the world", "do my dream"];

const About = async () => {
  const t = await getTranslations("about");
  const h = await getTranslations("home");

  // 연대기 내용은 messages/{ko,en}.json의 about.t{연도}_{순서}에서 수정한다.
  const timeline = [
    { year: "2026", items: [t("t2026_1")] },
    { year: "2025", items: [t("t2025_1"), t("t2025_2"), t("t2025_3"), t("t2025_4"), t("t2025_5"), t("t2025_6")] },
    { year: "2024", items: [t("t2024_1"), t("t2024_2")] },
    { year: "2023", items: [t("t2023_1"), t("t2023_2")] },
  ];

  const contacts = [
    { label: "Email", value: siteConfig.social.email, href: `mailto:${siteConfig.social.email}` },
    { label: "GitHub", value: "choitjddn0311", href: siteConfig.social.github },
    { label: "Instagram", value: "choitjddn31", href: siteConfig.social.instagram },
  ];

  return (
    <>
      <section className="about-hero">
        <figure className="about-photo">
          <Image src="/img/about_profile.jpg" alt={t("heroPhotoAlt")} fill priority sizes="(max-width: 680px) 83vw, 33vw" className="object-cover" />
        </figure>
        <figure className="about-photo-2">
          <Image src="/img/profile2.jpg" alt={t("cameraPhotoAlt")} fill sizes="16vw" className="object-cover" />
        </figure>
        <h1 className="about-name">
          <span className="about-name-kr display-kr">최성우</span>
          <span className="about-name-en display">SUNGWOO CHOI</span>
        </h1>
        <div className="about-low">
          <div className="meta flex flex-col gap-1 text-muted">
            <span>developer / photographer / videographer</span>
            <span>{t("heroSubtitle")}</span>
          </div>
        </div>
      </section>

      <div className="wrap">
        <section className="about-row">
          <h2 className="meta text-muted">{t("mottoLabel")}</h2>
          <p className="display about-motto">make life what i dream!</p>
        </section>

        <section className="about-row">
          <h2 className="meta text-muted">{t("aboutMe")}</h2>
          <div>
            <p className="about-lead">{t("aboutMeContent1")}</p>
            <p className="max-w-160 pt-3.5 leading-[1.75]">{t("aboutMeContent2")}</p>
            <p className="meta flex flex-wrap gap-x-3 pt-3.5 text-muted">
              {HASH_TAGS.map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
            </p>
          </div>
        </section>

        <section className="about-row">
          <h2 className="meta text-muted">{t("whatILove")}</h2>
          <div className="grid grid-cols-1 gap-6 min-[681px]:grid-cols-2">
            <div>
              <h3 className="pb-1.5 text-lg">{t("devTitle")}</h3>
              <p className="leading-[1.75] text-muted">{t("devContent")}</p>
            </div>
            <div>
              <h3 className="pb-1.5 text-lg">{t("photoTitle")}</h3>
              <p className="leading-[1.75] text-muted">{t("photoContent")}</p>
            </div>
          </div>
        </section>

        <section className="about-row">
          <h2 className="meta text-muted">{t("myGoals")}</h2>
          <div className="grid grid-cols-1 gap-6 min-[681px]:grid-cols-2">
            <div>
              <h3 className="pb-1.5 text-lg">{t("goal1Title")}</h3>
              <p className="leading-[1.75] text-muted">{t("goal1Desc")}</p>
            </div>
            <div>
              <h3 className="pb-1.5 text-lg">{t("goal2Title")}</h3>
              <p className="leading-[1.75] text-muted">{t("goal2Desc")}</p>
            </div>
          </div>
        </section>

        <section className="about-row">
          <h2 className="meta text-muted">{h("affiliation")} · {h("career")}</h2>
          <div className="flex flex-col gap-2 leading-[1.75]">
            <p>{h("affiliationText")}</p>
            <p>{h("careerText")}</p>
          </div>
        </section>

        <section className="about-row">
          <h2 className="meta text-muted">{t("timeline")}</h2>
          <div>
            {timeline.map((group) => (
              <div
                key={group.year}
                className="grid grid-cols-1 gap-x-6 gap-y-2 border-t border-line py-4 first:border-t-0 first:pt-0 min-[681px]:grid-cols-[3fr_5fr]"
              >
                <span className="display about-year">{group.year}</span>
                <ul>
                  {group.items.map((item) => (
                    <li key={item} className="py-0.5 leading-normal">{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="about-row">
          <h2 className="meta text-muted">{t("contact")}</h2>
          <ul>
            {contacts.map((contact, index) => (
              <li key={contact.label} className={index > 0 ? "border-t border-line" : ""}>
                <Link href={contact.href} className="flex min-h-11 flex-wrap items-center justify-between gap-x-4 py-2 hover:underline underline-offset-4">
                  <span className="text-muted">{contact.label}</span>
                  <span>{contact.value}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <div className="gap-m" />
    </>
  );
};

export default About;
