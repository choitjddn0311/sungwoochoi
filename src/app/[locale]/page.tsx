import type { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { FrameItem } from "@/components/common/Frame";
import FrameStrip from "@/components/common/FrameStrip";
import SectionFooter from "@/components/common/SectionFooter";
import PostRow from "@/components/posts/PostRow";
import { getAllPosts } from "@/lib/posts";
import { getVideoThumbnail, localizeProject, padCount, photos, projects, videos } from "@/lib/work";
import { pageMetadata } from "@/lib/seo";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "home", path: "/" });
}

const ROLES = ["developer", "photographer", "videographer"];

/** 사진, 개발, 영상, 글이 번갈아 나오도록 앞에서부터 하나씩 섞는다. */
const interleave = (groups: FrameItem[][]) => {
  const result: FrameItem[] = [];
  const longest = Math.max(...groups.map((group) => group.length));
  for (let i = 0; i < longest; i++) {
    groups.forEach((group) => {
      if (group[i]) result.push(group[i]);
    });
  }
  return result;
};

const Home = async ({ params }: PageProps) => {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const w = await getTranslations("work");
  const allPosts = getAllPosts();

  const frames = interleave([
    photos.slice(0, 2).map((photo) => ({
      key: `photo-${photo.src}`,
      title: photo.title ?? "",
      href: "/work/photo",
      image: { src: photo.src, alt: photo.alt, position: photo.position },
    })),
    projects.map((item) => localizeProject(item, locale, w("inProgress"))).map((project) => ({
      key: `project-${project.title}`,
      title: project.title,
      eyebrow: `${w("dev")} · ${project.period}`,
      href: "/work/dev",
    })),
    videos.slice(0, 2).map((video) => {
      const thumbnail = getVideoThumbnail(video);
      return {
        key: `video-${video.id}`,
        title: video.title,
        eyebrow: `${w("film")}${video.date ? ` · ${video.date}` : ""}`,
        href: "/work/film",
        image: thumbnail ? { src: thumbnail, alt: video.title } : undefined,
      };
    }),
    allPosts.slice(0, 3).map((post) => ({
      key: `post-${post.slug}`,
      title: post.title,
      eyebrow: `POST · ${post.date}`,
      href: `/posts/${post.slug}`,
    })),
  ]);

  return (
    <>
      <section>
        <div className="hero">
          <h1>
            <span className="hero-l1 display rise">
              SUNGWOO<span aria-hidden="true" className="inline!">—</span>
            </span>
            <span className="hero-l2 display rise [animation-delay:80ms]">CHOI</span>
            <span className="hero-l3 display-kr rise [animation-delay:160ms]">최성우</span>
          </h1>
          <figure className="hero-p1 photo">
            <Image
              src="/img/about_profile.jpg"
              alt={t("heroPhotoAlt")}
              fill
              priority
              sizes="(max-width: 680px) 62vw, 23vw"
              className="object-cover"
            />
          </figure>
          <figure className="hero-p2 photo">
            <Image
              src="/img/profile2.jpg"
              alt={t("cameraPhotoAlt")}
              fill
              sizes="(max-width: 680px) 30vw, 12vw"
              className="object-cover"
            />
          </figure>
          <ul className="hero-meta meta">
            {ROLES.map((role) => (
              <li key={role}>{role}</li>
            ))}
          </ul>
        </div>
      </section>

      <div className="wrap">
        <div className="meta flex flex-wrap justify-between gap-x-6 gap-y-2 border-t border-line py-3.5">
          <p>{t("greeting")}</p>
          <p className="text-muted">{t("introTitle")}</p>
        </div>
      </div>

      <div className="gap-l" />
      <FrameStrip items={frames} label={t("framesLabel")} />
      <div className="gap-m" />
      <SectionFooter count={frames.length} label="FRAMES" />

      <div className="gap-l" />
      <div className="wrap">
        <Link href="/work/dev" className="invert-row flex items-baseline justify-between gap-4 border-t border-line py-[clamp(14px,2vw,26px)]">
          <span className="display-kr entry-label">{w("dev")}</span>
          <span className="meta whitespace-nowrap text-muted">{t("projectCount", { count: padCount(projects.length) })}</span>
        </Link>
        <Link href="/work/photo" className="invert-row flex items-baseline justify-between gap-4 border-t border-line py-[clamp(14px,2vw,26px)]">
          <span className="display-kr entry-label">{t("mediaLabel")}</span>
          <span className="meta whitespace-nowrap text-muted">
            {t("mediaCount", { photos: padCount(photos.length), videos: padCount(videos.length) })}
          </span>
        </Link>
      </div>

      <div className="gap-l" />
      <div className="wrap">
        {allPosts.slice(0, 3).map((post) => (
          <PostRow key={post.slug} post={post} />
        ))}
      </div>
      <div className="gap-m" />
      <SectionFooter count={allPosts.length} label="POSTS" href="/posts" />
      <div className="gap-l" />
    </>
  );
};

export default Home;
