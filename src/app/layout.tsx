// 실제 <html>은 언어별 레이아웃(app/[locale]/layout.tsx)이 그린다.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
