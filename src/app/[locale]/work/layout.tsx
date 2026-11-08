import WorkNav from "@/components/work/WorkNav";

export default function WorkLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WorkNav />
      {children}
    </>
  );
}
