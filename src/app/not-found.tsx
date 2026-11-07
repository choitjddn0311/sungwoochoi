import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = { title: "404" };

export default async function NotFound() {
  const t = await getTranslations("errors");

  return (
    <div className="wrap flex min-h-[70vh] flex-col justify-center gap-5 py-16">
      <p className="display page-title">404</p>
      <h1 className="display-kr text-[clamp(30px,5vw,68px)]">{t("notFoundTitle")}</h1>
      <p className="text-muted">{t("notFoundMessage")}</p>
      <Link href="/" className="tap tap-start meta self-start underline underline-offset-4">
        {t("backToHome")}
      </Link>
    </div>
  );
}
