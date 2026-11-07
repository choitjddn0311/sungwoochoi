import { Inter_Tight, Noto_Sans_KR } from "next/font/google";
import localFont from "next/font/local";

// 영문 대형 글자와 정보성 글자
export const InterTight = Inter_Tight({
    subsets: ["latin"],
    weight: ["300", "400"],
    variable: "--ff-latin",
    display: "swap",
});

// 한글 대형 글자와 본문. 한글은 글자 범위별로 나눠 받으므로 미리 불러오지 않는다.
export const NotoSansKR = Noto_Sans_KR({
    weight: ["200", "300", "400"],
    variable: "--ff-kr",
    display: "swap",
    preload: false,
});

// 손글씨 메모 전용. 파일이 크므로(1.6MB) 쓰이는 페이지에서만 받는다.
export const Griun = localFont({
    src: [
        {
            path: "./Griun.ttf",
            weight: "400",
        }
    ],
    variable: "--ff-note",
    display: "swap",
    preload: false,
});
