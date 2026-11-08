"use client";

import { useEffect, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import ThemeToggle from "../common/themeToggle";
import LanguageToggle from "../common/LanguageToggle";

const MENU_ID = "mobile-menu";

const Header = ({ locale }: { locale: string }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const pathname = usePathname();
    const t = useTranslations("nav");
    const a = useTranslations("a11y");

    const headerMenu = [
        { label: t("home"), href: "/", match: (p: string) => p === "/" },
        { label: t("work"), href: "/work", match: (p: string) => p.startsWith("/work") },
        { label: t("posts"), href: "/posts", match: (p: string) => p.startsWith("/posts") },
        { label: t("about"), href: "/about", match: (p: string) => p.startsWith("/about") },
    ];

    // 전체 화면 메뉴가 열린 동안 Esc로 닫고 뒤쪽 페이지 스크롤을 막는다.
    useEffect(() => {
        if (!menuOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setMenuOpen(false);
        };
        document.addEventListener("keydown", onKeyDown);
        document.documentElement.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.documentElement.style.overflow = "";
        };
    }, [menuOpen]);

    return (
        <header className="sticky top-0 z-40 w-full bg-background text-foreground">
            <div className="wrap flex items-center justify-between gap-6 meta">
                <Link href="/" className="tap tap-start" onClick={() => setMenuOpen(false)}>
                    SUNGWOO CHOI
                </Link>

                <div className="flex items-center gap-1 sm:gap-4">
                    <nav aria-label={a("mainNav")} className="hidden sm:block">
                        <ul className="flex items-center gap-5">
                            {headerMenu.map((item) => {
                                const active = item.match(pathname);
                                return (
                                    <li key={item.label}>
                                        <Link
                                            href={item.href}
                                            aria-current={active ? "page" : undefined}
                                            className={`tap min-w-0 transition-colors duration-150 hover:text-foreground ${active ? "text-foreground" : "text-muted"}`}
                                        >
                                            {item.label}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    <LanguageToggle currentLocale={locale} />
                    <ThemeToggle />

                    <button
                        type="button"
                        className="tap sm:hidden"
                        onClick={() => setMenuOpen((open) => !open)}
                        aria-expanded={menuOpen}
                        aria-controls={MENU_ID}
                        aria-label={menuOpen ? a("closeMenu") : a("openMenu")}
                    >
                        <span aria-hidden="true" className="relative block h-3 w-6">
                            <span className={`absolute left-0 h-px w-6 bg-current transition-transform duration-200 ${menuOpen ? "top-1.5 rotate-45" : "top-0"}`} />
                            <span className={`absolute left-0 h-px w-6 bg-current transition-transform duration-200 ${menuOpen ? "top-1.5 -rotate-45" : "top-3"}`} />
                        </span>
                    </button>
                </div>
            </div>

            {/* 모바일 전체 화면 메뉴 */}
            {menuOpen && (
                <nav
                    id={MENU_ID}
                    aria-label={a("mainNav")}
                    className="fixed inset-x-0 top-11 bottom-0 z-40 overflow-y-auto bg-background sm:hidden"
                >
                    <ul className="wrap flex flex-col pt-6">
                        {headerMenu.map((item) => {
                            const active = item.match(pathname);
                            return (
                                <li key={item.label} className="border-t border-line">
                                    <Link
                                        href={item.href}
                                        aria-current={active ? "page" : undefined}
                                        onClick={() => setMenuOpen(false)}
                                        className={`display block py-4 text-[clamp(44px,14vw,72px)] ${active ? "text-foreground" : "text-muted"}`}
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            )}
        </header>
    );
};

export default Header;
