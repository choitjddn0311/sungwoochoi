import { getTranslations } from "next-intl/server";

/** 얇은 선이 좌우로 오가는 로딩 표시 */
export default async function LoadingSpinner() {
  const t = await getTranslations("errors");

  return (
    <div role="status" className="wrap flex min-h-[60vh] flex-col justify-center gap-3">
      <div className="relative h-px w-full overflow-hidden bg-line">
        <div className="loading-line absolute inset-y-0 w-1/4 bg-foreground" />
      </div>
      <span className="meta text-muted">{t("loading")}</span>
    </div>
  );
}
