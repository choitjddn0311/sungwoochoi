"use client";

import { useRef, useState } from "react";
import { useHydrated } from "@/lib/useHydrated";
import { Link } from "@/i18n/navigation";

// 저작권 문구. 사이트 주인을 위한 숨은 입구가 들어 있다.
// - 로그인한 동안에는 옆에 write 링크가 보인다(write_ui 쿠키는 표시용이고 비밀 값이 없다).
// - 문구를 2초 안에 5번 누르면 입구 키 입력칸이 나타난다. 방문자에게는 아무것도 보이지 않는다.
export default function FooterRights({ text }: { text: string }) {
  const hydrated = useHydrated();
  const taps = useRef<number[]>([]);
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");

  const loggedIn = hydrated && document.cookie.split("; ").includes("write_ui=1");

  const onTap = () => {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < 2000), now];
    if (taps.current.length >= 5) {
      taps.current = [];
      setOpen(true);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-x-4">
      <p onClick={onTap} className="select-none">
        {text}
      </p>
      {loggedIn && (
        <Link href="/write" className="tap min-w-0 transition-colors duration-150 hover:text-foreground">
          write
        </Link>
      )}
      {open && !loggedIn && (
        <form
          className="flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (key) window.location.href = `/api/write/login?key=${encodeURIComponent(key)}`;
          }}
        >
          <input
            type="password"
            autoFocus
            autoComplete="off"
            aria-label="입구 키"
            value={key}
            onChange={(event) => setKey(event.target.value)}
            onBlur={() => !key && setOpen(false)}
            className="w-28 border-b border-line bg-transparent py-1 text-foreground outline-none focus:border-foreground"
          />
        </form>
      )}
    </div>
  );
}
