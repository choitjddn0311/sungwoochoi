import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { siteConfig } from "@/lib/siteConfig";
import FooterRights from "@/components/layout/FooterRights";

const Footer = async () => {
    const t = await getTranslations("footer");

    const links = [
        { label: "Email", href: `mailto:${siteConfig.social.email}` },
        { label: "GitHub", href: siteConfig.social.github },
        { label: "Instagram", href: siteConfig.social.instagram },
    ];

    return (
        <footer className="w-full bg-background text-muted">
            <div className="wrap">
                <div className="meta flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-t border-line py-3">
                    <FooterRights text={t("rights")} />
                    <p>{t("roles")}</p>
                    <ul className="flex gap-4">
                        {links.map((link) => (
                            <li key={link.label}>
                                <Link href={link.href} className="tap min-w-0 transition-colors duration-150 hover:text-foreground">
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
