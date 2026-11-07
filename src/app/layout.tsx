import "./globals.css";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { InterTight, NotoSansKR } from "@/fonts/fonts"
import Theme from "@/_provider/themeProvider";
import { Metadata } from "next";
import { siteConfig } from "@/lib/siteConfig";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.author }],
  creator: siteConfig.author,
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
      <html
        lang={locale}
        className={`${InterTight.variable} ${NotoSansKR.variable}`}
        suppressHydrationWarning
      >
        <body>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <Theme>
              <Header locale={locale} />
              <main>{children}</main>
              <Footer />
            </Theme>
          </NextIntlClientProvider>
        </body>
      </html>
  )
}