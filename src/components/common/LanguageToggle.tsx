"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { setLocale } from "@/actions/locale";

const LanguageToggle = ({ currentLocale }: { currentLocale: string }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("a11y");

  const toggle = () => {
    const next = currentLocale === "ko" ? "en" : "ko";
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
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
