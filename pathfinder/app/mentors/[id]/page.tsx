import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionRole } from "@/lib/auth";
import { MENTORS, type MentorId } from "@/lib/prompts";
import { stageForGrade } from "@/lib/stages";
import ChatClient from "@/components/ChatClient";

const MENTOR_CATEGORY: Record<MentorId, string> = {
  priya: "Strategy",
  meera: "Music",
  arjun: "Competition",
  dev: "Writing",
  anaya: "Explore",
};

export const dynamic = "force-dynamic";

// Full-screen chat (outside the tab-bar shell, §8: "Chat is full-screen with back").
export default async function MentorChatPage({ params }: { params: { id: string } }) {
  const role = getSessionRole();
  if (!role) redirect("/login");
  if (role === "parent") redirect("/parent"); // transcripts are hers alone (§0.5)

  const mentor = MENTORS[params.id as MentorId];
  if (!mentor) notFound();

  const [history, profile] = await Promise.all([
    db.message.findMany({
      where: { mentorId: mentor.id, flagged: false },
      orderBy: { createdAt: "asc" },
      take: 100,
    }),
    db.profile.findUnique({ where: { id: "student" } }),
  ]);

  return (
    <ChatClient
      mentorId={mentor.id}
      mentorName={mentor.name}
      mentorRole={mentor.role}
      stage={stageForGrade(profile?.grade ?? 8)}
      category={MENTOR_CATEGORY[mentor.id]}
      initialMessages={history.map((m) => ({ id: m.id, role: m.role, content: m.content }))}
    />
  );
}
