"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  return (
    <div className="wrap flex min-h-[70vh] flex-col justify-center gap-5 py-16">
      <p className="display page-title">500</p>
      <h1 className="display-kr text-[clamp(30px,5vw,68px)]">{t("errorTitle")}</h1>
      <p className="text-muted">{t("errorMessage")}</p>
      <div className="meta flex gap-6">
        <button type="button" onClick={reset} className="tap tap-start underline underline-offset-4">
          {t("retry")}
        </button>
        <Link href="/" className="tap tap-start text-muted underline underline-offset-4 hover:text-foreground">
          {t("backToHome")}
        </Link>
      </div>
    </div>
  );
}
