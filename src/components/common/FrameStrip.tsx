"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { padCount } from "@/lib/work";
import Frame, { type FrameItem } from "./Frame";

// globals.css의 .frame 전환 시간과 곡선에 맞춘다.
const MOVE_DURATION = 450;
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

interface FrameStripProps {
  items: FrameItem[];
  label: string;
  /** 처음 선택할 프레임 순서 */
  initial?: number;
  /** 선택한 프레임을 더 크게 보여 주는 사진용 띠 */
  large?: boolean;
}

const FrameStrip = ({ items, label, initial = 0, large = false }: FrameStripProps) => {
  const t = useTranslations("strip");
  const [selected, setSelected] = useState(initial);
  const stripRef = useRef<HTMLDivElement>(null);
  const shouldCenter = useRef(false);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const moveFrame = useRef(0);
  const isMoving = useRef(false);

  // 버튼이나 키보드로 고른 프레임은 크기가 바뀐 뒤 가운데로 옮긴다.
  useEffect(() => {
    if (!shouldCenter.current) return;
    shouldCenter.current = false;
    const strip = stripRef.current;
    const frame = strip?.children[selected] as HTMLElement | undefined;
    if (!strip || !frame) return;

    // 프레임 크기가 바뀌는 동안 가운데 위치도 함께 변하므로 매 프레임 다시 계산한다.
    const centerOf = () => frame.offsetLeft - (strip.clientWidth - frame.offsetWidth) / 2;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      strip.scrollLeft = centerOf();
      return;
    }

    cancelAnimationFrame(moveFrame.current);
    const from = strip.scrollLeft;
    const startedAt = performance.now();

    const step = (now: number) => {
      // 첫 프레임의 시각은 시작 시각보다 앞설 수 있어 0 아래로 내려가지 않게 막는다.
      const progress = Math.max(0, Math.min(1, (now - startedAt) / MOVE_DURATION));
      strip.scrollLeft = from + (centerOf() - from) * easeOutCubic(progress);
      if (progress < 1) {
        moveFrame.current = requestAnimationFrame(step);
      } else {
        isMoving.current = false;
        strip.style.scrollSnapType = "";
      }
    };
    moveFrame.current = requestAnimationFrame(step);
  }, [selected]);

  useEffect(
    () => () => {
      clearTimeout(scrollTimer.current);
      cancelAnimationFrame(moveFrame.current);
    },
    [],
  );

  if (items.length === 0) return null;

  const moveTo = (index: number) => {
    if (index === selected) return;
    // 크기가 바뀌는 순간 브라우저 스냅이 끼어들어 튀지 않도록 렌더 전에 끈다.
    const strip = stripRef.current;
    if (strip && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      strip.style.scrollSnapType = "none";
      isMoving.current = true;
    }
    shouldCenter.current = true;
    setSelected(index);
  };

  const move = (delta: number) => moveTo((selected + delta + items.length) % items.length);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      move(e.key === "ArrowRight" ? 1 : -1);
    }
  };

  // 터치로 넘겼을 때는 멈춘 위치에서 가운데에 가장 가까운 프레임을 고른다.
  const onScroll = () => {
    clearTimeout(scrollTimer.current);
    if (isMoving.current) return;
    scrollTimer.current = setTimeout(() => {
      const strip = stripRef.current;
      if (!strip) return;
      const center = strip.scrollLeft + strip.clientWidth / 2;
      let nearest = 0;
      let distance = Infinity;
      Array.from(strip.children).forEach((child, index) => {
        const el = child as HTMLElement;
        const d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - center);
        if (d < distance) {
          distance = d;
          nearest = index;
        }
      });
      // 양 끝에서는 스크롤로 가운데에 올 수 없는 프레임이 있으므로 선택을 유지한다.
      const atStart = strip.scrollLeft <= 1;
      const atEnd = strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 1;
      if (!atStart && !atEnd) setSelected(nearest);
    }, 150);
  };

  const current = items[selected];

  return (
    <div className="flex flex-col gap-3.5">
      <div
        ref={stripRef}
        className={`strip${large ? " strip-large" : ""}`}
        tabIndex={0}
        role="region"
        aria-label={label}
        onKeyDown={onKeyDown}
        onScroll={onScroll}
      >
        {items.map((item, index) => (
          <Frame
            key={item.key}
            item={item}
            selected={index === selected}
            sizes={large ? "(max-width: 680px) 78vw, 38vw" : "(max-width: 680px) 68vw, 25vw"}
            onSelect={() => moveTo(index)}
            onFocus={() => setSelected(index)}
          />
        ))}
      </div>
      <div className="wrap flex items-center justify-between gap-4">
        <p className="meta text-muted" aria-live="polite">
          {padCount(selected + 1)} / {padCount(items.length)}
          {current.image && current.title ? `  ${current.title}` : ""}
        </p>
        <div className="flex flex-none gap-1.5">
          <button type="button" className="round-button" aria-label={t("previous")} onClick={() => move(-1)}>
            <span aria-hidden="true">←</span>
          </button>
          <button type="button" className="round-button" aria-label={t("next")} onClick={() => move(1)}>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FrameStrip;
