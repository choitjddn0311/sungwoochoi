"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { useHydrated } from "@/lib/useHydrated";

const CYCLE: Record<string, string> = { light: "dark", dark: "system", system: "light" };
const SHORT_LABEL: Record<string, string> = { light: "Light", dark: "Dark", system: "Auto" };

const ThemeToggle = () => {
    const { theme, setTheme } = useTheme();
    const hydrated = useHydrated();
    const t = useTranslations("a11y");

    // 서버 렌더에서는 저장된 테마를 알 수 없으므로 자리만 잡아 둔다.
    if (!hydrated) return <span aria-hidden="true" className="tap meta" />;

    const current = theme ?? "system";
    const names: Record<string, string> = {
        light: t("themeLight"),
        dark: t("themeDark"),
        system: t("themeSystem"),
    };

    return (
        <button
            type="button"
            onClick={() => setTheme(CYCLE[current] ?? "dark")}
            className="tap meta text-muted transition-colors duration-150 hover:text-foreground sm:justify-end"
            aria-label={t("changeTheme", { current: names[current] ?? current })}
        >
            {SHORT_LABEL[current] ?? "Auto"}
        </button>
    );
};

export default ThemeToggle;
