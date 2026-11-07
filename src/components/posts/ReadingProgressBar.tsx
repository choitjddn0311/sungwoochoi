"use client";
import { useEffect, useRef } from "react";

export default function ReadingProgressBar() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      if (!barRef.current) return;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const progress = total > 0 ? (window.scrollY / total) * 100 : 0;
      barRef.current.style.width = `${progress}%`;
    };

    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <div
      ref={barRef}
      className="fixed top-0 left-0 h-0.5 bg-foreground z-50"
      style={{ width: "0%" }}
    />
  );
}
