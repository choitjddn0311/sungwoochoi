import { notFound } from "next/navigation";

// 없는 주소도 해당 언어의 404 화면을 보여 준다
export default function CatchAll() {
  notFound();
}
