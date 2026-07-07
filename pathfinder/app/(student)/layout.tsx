import { redirect } from "next/navigation";
import { getSessionRole } from "@/lib/auth";
import TabBar from "@/components/TabBar";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const role = getSessionRole();
  if (!role) redirect("/login");
  if (role === "parent") redirect("/parent");

  return (
    <div className="mx-auto min-h-dvh max-w-md">
      <main className="px-4 pb-28 pt-6">{children}</main>
      <TabBar />
    </div>
  );
}
