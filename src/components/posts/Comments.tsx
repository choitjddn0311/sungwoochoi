"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

const REPO = "choitjddn0311/swdev";

const Comments = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const t = useTranslations("post");

  const utterancesTheme = resolvedTheme === "dark" ? "github-dark" : "github-light";

  // 최초 마운트 시 스크립트 삽입
  useEffect(() => {
    if (!ref.current || ref.current.hasChildNodes()) return;

    const script = document.createElement("script");
    script.src = "https://utteranc.es/client.js";
    script.setAttribute("repo", REPO);
    script.setAttribute("issue-term", "pathname");
    script.setAttribute("theme", utterancesTheme);
    script.setAttribute("crossorigin", "anonymous");
    script.async = true;
    ref.current.appendChild(script);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 테마 변경 시 utterances iframe에 동기화
  useEffect(() => {
    const iframe = document.querySelector<HTMLIFrameElement>(".utterances-frame");
    if (!iframe) return;
    iframe.contentWindow?.postMessage(
      { type: "set-theme", theme: utterancesTheme },
      "https://utteranc.es"
    );
  }, [utterancesTheme]);

  return (
    <section className="wrap pt-[clamp(48px,7vw,96px)]">
      <h2 className="meta border-b border-line pb-3.5 text-muted">{t("comments")}</h2>
      <div ref={ref} className="pt-4" />
    </section>
  );
};

export default Comments;
