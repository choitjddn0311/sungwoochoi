"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

const LanguageToggle = ({ currentLocale }: { currentLocale: string }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("a11y");

  // 같은 페이지의 다른 언어 주소로 이동한다. 검색어와 태그 같은 쿼리도 유지한다.
  const toggle = () => {
    const next = currentLocale === "ko" ? "en" : "ko";
    const search = window.location.search;
    startTransition(() => {
      router.replace(`${pathname}${search}`, { locale: next });
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      aria-label={t("switchLanguage")}
      className="tap meta text-muted transition-colors duration-150 hover:text-foreground disabled:opacity-50"
    >
      {currentLocale === "ko" ? "EN" : "KO"}
    </button>
  );
};

export default LanguageToggle;
