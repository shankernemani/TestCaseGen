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
  // SEED_*_PIN only applies on first creation. Rotating an EXISTING user's
  // PIN from the seed requires the explicit one-shot SEED_ROTATE_PINS=1 —
  // otherwise a routine re-seed (with stale vars sitting in .env) would
  // silently overwrite a PIN that was changed in-app.
  const studentPinEnv = process.env.SEED_STUDENT_PIN;
  const parentPinEnv = process.env.SEED_PARENT_PIN;
  const rotate = process.env.SEED_ROTATE_PINS === "1";
  const studentPin = studentPinEnv ?? "1213";
  const parentPin = parentPinEnv ?? "2026";

  await prisma.user.upsert({
    where: { role: "STUDENT" },
    create: { role: "STUDENT", name: "Sarvagna", ...hashPin(studentPin) },
    update: rotate && studentPinEnv ? hashPin(studentPinEnv) : {},
  });
  await prisma.user.upsert({
    where: { role: "PARENT" },
    create: { role: "PARENT", name: "Appa", ...hashPin(parentPin) },
    update: rotate && parentPinEnv ? hashPin(parentPinEnv) : {},
  });
  if (!studentPinEnv || !parentPinEnv) {
    console.warn(
      "⚠ Default PINs may be in use — change them in the app (Profile → Change PIN), or set SEED_*_PIN plus SEED_ROTATE_PINS=1 and re-seed.",
    );
  }

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
            "Draft a piece for the Queen's Commonwealth Writing Competition 2027 (18-and-under, any written form up to 1,000 words)",
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
        // The one paid item the spec endorses (§0, Priya's knowledge): human
        // ex-AO judgment, bought à la carte at the end instead of bundled for
        // five years. Lives on the Grade 12 stage of the roadmap; no due date
        // so it doesn't crowd near-term goals out of "This week" or mentor
        // context.
        {
          title:
            "Book a one-off application review with an independent former admissions officer (the one paid item worth it — à la carte, not a 5-year bundle)",
          status: "open",
          stage: 5,
          source: "priya",
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
            "Queen's Commonwealth Writing Competition 2027 — expected deadline (rebranded from the Essay Competition; single 18-and-under category, ≤1,000 words, any written form)",
          date: new Date("2027-04-30"),
          url: "https://www.royalcwsociety.org/writing-competition",
          mentorId: "dev",
          notes:
            "2026 cycle closed 30 Apr 2026. 2027 cycle expected to open ~Feb — verify theme and dates when announced.",
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
        {
          title:
            "Start researching independent ex-admissions-officer review services (book one for Grade 12 application season)",
          date: new Date("2030-04-15"),
          mentorId: "priya",
          notes:
            "Grade 11 spring. One-off application/essay reviews by former admissions officers cost hundreds, not thousands — compare a few, check real AO credentials, book for autumn.",
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
