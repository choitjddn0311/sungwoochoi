"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { getVideoEmbedUrl, getVideoThumbnail, type Video } from "@/lib/work";

/** 처음에는 썸네일만 보여 주고, 누르면 그 자리에서 플레이어를 불러온다. */
const VideoFrame = ({ video }: { video: Video }) => {
  const [playing, setPlaying] = useState(false);
  const [hd, setHd] = useState(true);
  const t = useTranslations("work");

  if (playing) {
    return (
      <div className="film-box">
        <iframe
          src={getVideoEmbedUrl(video)}
          title={video.title}
          className="absolute inset-0 h-full w-full"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  const thumbnail = getVideoThumbnail(video, hd);

  return (
    <button
      type="button"
      className="film-box"
      onClick={() => setPlaying(true)}
      aria-label={t("play", { title: video.title })}
    >
      {thumbnail && (
        <Image
          src={thumbnail}
          alt=""
          fill
          sizes="(max-width: 680px) 100vw, 68vw"
          className="object-cover"
          onError={() => setHd(false)}
        />
      )}
      <span className="film-play" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
          <path d="M4 2.5v13l11-6.5z" />
        </svg>
      </span>
    </button>
  );
};

export default VideoFrame;
