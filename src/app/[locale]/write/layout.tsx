// 로그인 확인은 각 페이지에서 한다. 로그인하지 않은 사람에게는 일반 404와 똑같이 보여야 해서
// 여기서는 제목 같은 메타데이터를 따로 정하지 않는다.
export const dynamic = "force-dynamic";

export default function WriteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
