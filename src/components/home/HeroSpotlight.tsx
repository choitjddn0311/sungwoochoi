"use client";

import { useEffect, useRef } from "react";

const LERP = 0.07;   // 낮을수록 더 느리게 따라옴 (관성 강도)
const RADIUS = 200;  // 빛 퍼지는 반경 (px)
const COLOR = "color-mix(in srgb, var(--foreground) 8%, transparent)"; // 테마에 맞는 옅은 빛

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const HeroSpotlight = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let rafId: number;

    const animate = () => {
      currentX = lerp(currentX, targetX, LERP);
      currentY = lerp(currentY, targetY, LERP);
      el.style.background = `radial-gradient(${RADIUS}px circle at ${currentX}px ${currentY}px, ${COLOR}, transparent 70%)`;
      rafId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      targetX = e.clientX - rect.left;
      targetY = e.clientY - rect.top;
    };

    const handleMouseEnter = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      // 진입 시 현재 위치로 스냅 — 이전 위치에서 튀어오는 느낌 방지
      currentX = e.clientX - rect.left;
      currentY = e.clientY - rect.top;
      targetX = currentX;
      targetY = currentY;
      el.style.opacity = "1";
      rafId = requestAnimationFrame(animate);
    };

    const handleMouseLeave = () => {
      el.style.opacity = "0";
      cancelAnimationFrame(rafId);
    };

    parent.addEventListener("mousemove", handleMouseMove);
    parent.addEventListener("mouseenter", handleMouseEnter);
    parent.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      parent.removeEventListener("mousemove", handleMouseMove);
      parent.removeEventListener("mouseenter", handleMouseEnter);
      parent.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="absolute inset-0 pointer-events-none transition-opacity duration-500"
      style={{ opacity: 0 }}
    />
  );
};

export default HeroSpotlight;
