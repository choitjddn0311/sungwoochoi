"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { padCount, photoRatio, type Photo } from "@/lib/work";

interface PhotoScrollerProps {
  photos: Photo[];
  label: string;
}

/**
 * 사진 모음. 섹션이 화면에 고정되고 스크롤하면 사진과 글이 차례로 바뀐다.
 * 세로 사진은 왼쪽, 가로 사진은 오른쪽에 두고 글은 반대쪽 빈 공간에 둔다.
 */
const PhotoScroller = ({ photos, label }: PhotoScrollerProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const section = sectionRef.current;
      const stage = stageRef.current;
      if (!section || !stage) return;
      const distance = section.offsetHeight - stage.offsetHeight;
      const progress = Math.min(1, Math.max(0, -section.getBoundingClientRect().top / Math.max(1, distance)));
      if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`;
      setActive(Math.min(photos.length - 1, Math.floor(progress * photos.length)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [photos.length]);

  const landscape = photoRatio(photos[active]) > 1;

  return (
    <section
      ref={sectionRef}
      className="photo-scroller"
      style={{ "--n": String(photos.length) } as React.CSSProperties}
      aria-label={label}
    >
      <div ref={stageRef} className="photo-stage" data-flip={landscape}>
        <div className="photo-frames">
          {photos.map((photo, index) => (
            <div
              key={photo.src}
              className="photo-slide"
              data-state={index === active ? "on" : index < active ? "past" : "next"}
              aria-hidden={index !== active}
            >
              <div className="photo" data-selected={index === active} style={{ "--ar": String(photoRatio(photo)) } as React.CSSProperties}>
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 680px) 100vw, 66vw"
                  priority={index === 0}
                  className="object-cover"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="photo-text">
          <p className="photo-count" aria-live="polite">
            {padCount(active + 1)}
            <span className="meta ml-2 text-muted">/ {padCount(photos.length)}</span>
          </p>
          <div className="photo-caps">
            {photos.map((photo, index) => {
              const info = [photo.place, photo.camera, photo.lens].filter(Boolean).join(" · ");
              return (
                <div key={photo.src} className="photo-cap" data-on={index === active} aria-hidden={index !== active}>
                  <h2 className="photo-cap-title">{photo.title}</h2>
                  {photo.date && <p className="meta text-muted">{photo.date}</p>}
                  {info && <p className="meta text-muted">{info}</p>}
                  {photo.instagram && (
                    <a
                      href={photo.instagram}
                      target="_blank"
                      rel="noreferrer"
                      tabIndex={index === active ? 0 : -1}
                      className="meta mt-2 w-fit underline underline-offset-4 hover:text-foreground"
                    >
                      Instagram ↗
                    </a>
                  )}
                </div>
              );
            })}
          </div>
          <div className="photo-progress" aria-hidden="true">
            <i ref={barRef} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default PhotoScroller;
