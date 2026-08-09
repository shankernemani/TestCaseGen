import SideNav from "@/components/SideNav";

// Student app shell: sidebar on desktop (md+), bottom tabs on mobile (each
// page renders BottomNav itself, hidden at md+). Content shifts right of the
// rail; pages own their max-width.
export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SideNav />
      <div className="md:pl-60">{children}</div>
    </>
  );
}
