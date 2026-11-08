import Link from "next/link";
import "./globals.css";

// 언어 레이아웃 밖에서 생긴 404. 보통은 app/[locale]/not-found.tsx가 쓰인다.
export default function GlobalNotFound() {
  return (
    <html lang="ko" className="dark">
      <body>
        <main className="wrap flex min-h-screen flex-col justify-center gap-4">
          <p className="display text-[clamp(50px,13vw,180px)]">404</p>
          <Link href="/" className="meta underline underline-offset-4">홈으로 돌아가기</Link>
        </main>
      </body>
    </html>
  );
}
