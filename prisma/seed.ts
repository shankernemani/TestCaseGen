// Seeds the two auth profiles, Sarvagna's student profile, and a small set of
// Grade-8 starter goals/deadlines drawn from the spec's strategy content
// (Queen's Commonwealth junior window, practice logging, thread exploration).

import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "crypto";

const prisma = new PrismaClient();

function hashPin(pin: string) {
  const salt = randomBytes(16).toString("hex");
  return { pinHash: scryptSync(pin, salt, 32).toString("hex"), pinSalt: salt };
}

async function main() {
  const studentPin = process.env.SEED_STUDENT_PIN ?? "1213";
  const parentPin = process.env.SEED_PARENT_PIN ?? "2026";

  await prisma.user.upsert({
    where: { role: "STUDENT" },
    create: { role: "STUDENT", name: "Sarvagna", ...hashPin(studentPin) },
    update: {},
  });
  await prisma.user.upsert({
    where: { role: "PARENT" },
    create: { role: "PARENT", name: "Appa", ...hashPin(parentPin) },
    update: {},
  });

  await prisma.studentProfile.upsert({
    where: { id: "sarvagna" },
    create: {
      id: "sarvagna",
      grade: 8,
      birthYear: 2012,
      interests:
        "Carnatic vocal music (4–5 years of training, working toward her arangetram), reading, languages",
      strengths:
        "School-level Olympiad gold medals in English and Social Studies; strong language skills; disciplined musical training",
      notes:
        "Exploring academic interests; Grade 8 is for exploration and habit-building. Target: top US/UK university, 2031 entry, ideally with financial aid.",
      thread: "Carnatic music × [her emerging academic interest]",
    },
    update: {},
  });

  const goalCount = await prisma.goal.count();
  if (goalCount === 0) {
    await prisma.goal.createMany({
      data: [
        {
          title: "Start a weekly Carnatic practice log (what you practiced, for how long)",
          status: "open",
          stage: 1,
          source: "meera",
          capstoneType: "independent",
        },
        {
          title:
            "Draft an entry for the Queen's Commonwealth Essay Competition (Junior category — you're inside the <14 window now)",
          status: "open",
          stage: 1,
          source: "arjun",
          capstoneType: "institutional",
        },
        {
          title: "Try 3 Panini Linguistics Olympiad practice puzzles with Arjun",
          status: "open",
          stage: 1,
          source: "arjun",
          capstoneType: "institutional",
        },
        {
          title: "Write 1 'Win or Spark' journal entry each week",
          status: "open",
          stage: 1,
          source: "dev",
        },
        {
          title: "Explore 3 possible academic interests with Anaya (one 30-minute experiment each)",
          status: "open",
          stage: 1,
          source: "anaya",
        },
        {
          title: "Record one polished piece with good audio this term (start of the arts-supplement archive)",
          status: "open",
          stage: 1,
          source: "meera",
          capstoneType: "innovative",
        },
      ],
    });
  }

  // Competition calendar from Arjun's swim-lane map (§2.2). All dates are
  // typical-year approximations — every entry says to verify officially.
  const deadlineCount = await prisma.deadline.count();
  if (deadlineCount === 0) {
    const verify = "Typical-year date — always verify on the official site.";
    await prisma.deadline.createMany({
      data: [
        {
          title:
            "Queen's Commonwealth Essay — Junior (<14) submission window closes. She's inside the junior window NOW.",
          date: new Date("2026-09-15"),
          url: "https://www.royalcwsociety.org/essay-competition",
          mentorId: "arjun",
          notes: verify,
        },
        {
          title:
            "HBCSE IOQ registration (olympiad ladder first rung; IJSO route, <16)",
          date: new Date("2026-10-01"),
          url: "https://olympiads.hbcse.tifr.res.in",
          mentorId: "arjun",
          notes: verify,
        },
        {
          title:
            "Panini Linguistics Olympiad — registration opens (Arjun's top swim-lane pick)",
          date: new Date("2026-11-01"),
          url: "https://plo-in.org",
          mentorId: "arjun",
          notes: verify,
        },
        {
          title: "Math Kangaroo India registration closes",
          date: new Date("2026-11-20"),
          url: "https://mathkangaroo.in",
          mentorId: "arjun",
          notes: verify,
        },
        {
          title:
            "Technovation Girls — team registration opens ('music-tech for good' angle)",
          date: new Date("2026-12-10"),
          url: "https://technovationchallenge.org",
          mentorId: "arjun",
          notes: verify,
        },
        {
          title:
            "Cleveland Thyagaraja Aradhana youth competitions — entries typically due (confirm with guru first)",
          date: new Date("2027-01-15"),
          url: "https://aradhana.org",
          mentorId: "meera",
          notes: verify,
        },
        {
          title: "John Locke Institute Junior Prize (<15) — essays typically due",
          date: new Date("2027-06-30"),
          url: "https://www.johnlockeinstitute.com/essay-competition",
          mentorId: "arjun",
          notes: verify,
        },
        {
          title:
            "Breakthrough Junior Challenge (13–18) — science-explainer video due; a trained performer has a real edge",
          date: new Date("2027-06-25"),
          url: "https://breakthroughjuniorchallenge.org",
          mentorId: "arjun",
          notes: verify,
        },
        {
          title: "IRIS National Fair — project applications typically due",
          date: new Date("2027-07-31"),
          url: "https://www.irisnationalfair.org",
          mentorId: "arjun",
          notes: `${verify} A music-cognition project qualifies.`,
        },
      ],
    });
  }

  console.log("Seed complete.");
  console.log(`  Sarvagna PIN: ${studentPin}   Parent PIN: ${parentPin}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
