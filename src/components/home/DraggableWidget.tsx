"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { PostMeta } from "@/lib/posts";
import { useTranslations } from "next-intl";

interface DraggableWidgetProps {
  posts: PostMeta[];
}

const WIDGET_WIDTH = 288;
const HEADER_HEIGHT = 44;
const EXPANDED_HEIGHT = 340;

const DraggableWidget = ({ posts }: DraggableWidgetProps) => {
  const t = useTranslations("widget");
  // 드래그 전에는 null: CSS로 오른쪽 아래에 붙어 있어 펼치면 위로 늘어난다.
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  // 첫 화면을 가리지 않도록 접힌 상태로 시작한다.
  const [isMinimized, setIsMinimized] = useState(true);
  const [isClosed, setIsClosed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const widgetRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const moveTo = (clientX: number, clientY: number) => {
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - WIDGET_WIDTH, clientX - dragOffset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - HEADER_HEIGHT, clientY - dragOffset.current.y)),
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) moveTo(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      moveTo(e.touches[0].clientX, e.touches[0].clientY);
    };

    const stopDrag = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", stopDrag);
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", stopDrag);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", stopDrag);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", stopDrag);
    };
  }, []);

  if (isClosed) return null;

  const startDrag = (clientX: number, clientY: number) => {
    const rect = widgetRef.current?.getBoundingClientRect();
    if (!rect) return;
    isDraggingRef.current = true;
    setIsDragging(true);
    dragOffset.current = { x: clientX - rect.left, y: clientY - rect.top };
  };

  const toggleMinimized = () => {
    // 아래쪽으로 옮겨 둔 위젯을 펼칠 때 화면 밖으로 나가지 않게 올린다.
    if (isMinimized && position) {
      setPosition({ ...position, y: Math.max(0, Math.min(position.y, window.innerHeight - EXPANDED_HEIGHT)) });
    }
    setIsMinimized((value) => !value);
  };

  return (
    <div
      ref={widgetRef}
      className="fixed z-30 border border-line bg-background text-foreground"
      style={{
        width: `min(${WIDGET_WIDTH}px, calc(100vw - 32px))`,
        userSelect: "none",
        ...(position ? { left: position.x, top: position.y } : { right: 16, bottom: 16 }),
      }}
    >
      {/* 드래그 핸들 */}
      <div
        className={`flex items-center justify-between bg-surface pl-3.5 ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
        onMouseDown={(e) => {
          e.preventDefault();
          startDrag(e.clientX, e.clientY);
        }}
        onTouchStart={(e) => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
      >
        <span className="meta select-none">{t("title")}</span>
        <div className="flex items-center">
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={toggleMinimized}
            className="tap meta"
            aria-label={isMinimized ? t("expand") : t("minimize")}
            aria-expanded={!isMinimized}
          >
            <span aria-hidden="true">{isMinimized ? "+" : "−"}</span>
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={() => setIsClosed(true)}
            className="tap meta"
            aria-label={t("close")}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <ul className="flex flex-col divide-y divide-line">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link href={`/posts/${post.slug}`} className="group flex items-start justify-between gap-2 px-3.5 py-3">
                  <span className="meta line-clamp-1 flex-1 group-hover:underline">{post.title}</span>
                  <time className="meta mt-px shrink-0 text-muted">{post.date.slice(0, 7)}</time>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/posts" className="meta flex justify-end border-t border-line px-3.5 py-3 text-muted hover:text-foreground">
            {t("viewAll")}
          </Link>
        </>
      )}
    </div>
  );
};

export default DraggableWidget;
