import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isMentorId, MENTORS } from "@/lib/mentors";
import ChatClient from "@/components/ChatClient";
import { MENTOR_BG } from "@/components/mentorColors";

export const dynamic = "force-dynamic";

export default async function MentorChatPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "PARENT") redirect("/parent");
  if (!isMentorId(params.id)) notFound();

  const mentor = MENTORS[params.id];
  const recent = await prisma.chatMessage.findMany({
    where: { mentorId: mentor.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  recent.reverse();

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center gap-3 border-b border-silk-200 bg-silk-50 px-3 py-2.5">
        <Link href="/mentors" aria-label="Back" className="p-1 text-ink-soft">
          <ChevronLeft size={22} />
        </Link>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full font-display font-bold text-silk-50 ${MENTOR_BG[mentor.color]}`}
        >
          {mentor.name[0]}
        </span>
        <div className="leading-tight">
          <p className="font-semibold">{mentor.name}</p>
          <p className="text-xs text-ink-faint">{mentor.role}</p>
        </div>
      </header>
      <div className="min-h-0 flex-1">
        <ChatClient
          mentorId={mentor.id}
          mentorName={mentor.name}
          color={mentor.color}
          opener={mentor.opener}
          initialMessages={recent.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          }))}
        />
      </div>
    </div>
  );
}
