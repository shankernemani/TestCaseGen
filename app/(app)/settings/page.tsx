import { redirect } from "next/navigation";
import { Download } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import ProfileForm from "@/components/ProfileForm";
import LogoutButton from "@/components/LogoutButton";
import ChangePinForm from "@/components/ChangePinForm";
import BottomNav from "@/components/BottomNav";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "PARENT") redirect("/parent");

  const profile = await prisma.studentProfile.findUnique({
    where: { id: "sarvagna" },
  });
  if (!profile) redirect("/login");

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 pb-24 pt-6 md:px-8 md:pb-12 md:pt-10">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Profile</h1>
          <p className="text-sm text-ink-soft">
            When Anaya spots what lights you up, update your thread here.
          </p>
        </div>
        <LogoutButton />
      </header>

      <ProfileForm
        initial={{
          grade: profile.grade,
          interests: profile.interests,
          strengths: profile.strengths,
          notes: profile.notes,
          thread: profile.thread,
        }}
      />

      <ChangePinForm />

      <a
        href="/api/export"
        download
        className="card flex items-center gap-3 text-sm font-semibold text-peacock-700"
      >
        <Download size={18} />
        Download a full backup (JSON)
      </a>

      <BottomNav />
    </main>
  );
}
