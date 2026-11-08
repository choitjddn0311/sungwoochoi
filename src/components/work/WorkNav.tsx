"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const WorkNav = () => {
  const pathname = usePathname();
  const t = useTranslations("work");

  const item = (href: string, label: string) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`tap tap-start min-w-0 transition-colors duration-150 hover:text-foreground ${
          active ? "text-foreground underline underline-offset-4" : "text-muted"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <nav aria-label={t("navLabel")} className="wrap">
      <div className="meta flex flex-wrap items-center gap-x-4 border-b border-line">
        {item("/work", t("overview"))}
        <span aria-hidden="true" className="text-line">/</span>
        {item("/work/dev", t("dev"))}
        <span aria-hidden="true" className="text-line">/</span>
        <span className="text-muted">{t("media")}:</span>
        {item("/work/photo", t("photo"))}
        {item("/work/film", t("film"))}
      </div>
    </nav>
  );
};

export default WorkNav;
