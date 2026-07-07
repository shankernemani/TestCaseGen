/**
 * Pathfinder seed data — §6 of the spec.
 * Run with: npx prisma db seed
 */
import { PrismaClient } from "@prisma/client";
import { hashPin } from "../lib/pin";

const prisma = new PrismaClient();

// ---------------------------------------------------------------- §6.1 Profiles
async function seedProfiles() {
  const studentPin = process.env.SEED_STUDENT_PIN || "1008";
  const parentPin = process.env.SEED_PARENT_PIN || "2653";

  await prisma.profile.upsert({
    where: { id: "student" },
    update: {},
    create: {
      id: "student",
      role: "student",
      name: "Sarvagna",
      grade: 8,
      interests:
        "Carnatic vocal music (4–5 years, working toward arangetram), reading, English & Social Studies",
      strengths:
        "School Olympiad golds (English, Social Studies); disciplined music practice",
      notes:
        "Exploring subjects. Target: top US/UK university 2031, ideally with financial aid.",
      pinHash: hashPin(studentPin),
    },
  });

  await prisma.profile.upsert({
    where: { id: "parent" },
    update: {},
    create: {
      id: "parent",
      role: "parent",
      name: "Shanker",
      grade: 0,
      interests: "",
      strengths: "",
      notes: "Parent / project-manager view.",
      pinHash: hashPin(parentPin),
    },
  });
}

// ---------------------------------------------------------------- Mentors
async function seedMentors() {
  for (const id of ["priya", "meera", "arjun", "dev", "anaya"]) {
    await prisma.mentor.upsert({ where: { id }, update: {}, create: { id } });
  }
}

// ---------------------------------------------------------------- §6.2 Roadmap tasks
type SeedTask = { stage: string; category: string; title: string };

const T = (stage: string, category: string, title: string): SeedTask => ({ stage, category, title });

const ROADMAP: SeedTask[] = [
  // g8 (Discovery — ACTIVE)
  T("g8", "Writing", "Enter Queen's Commonwealth Essay Junior (under-14 window closes this year!)"),
  T("g8", "Competition", "Register for 2 school Olympiads"),
  T("g8", "Competition", "Attempt World Scholar's Cup or one MUN"),
  T("g8", "Music", "Record 2 Carnatic pieces properly; start repertoire + performance logs"),
  T("g8", "Music", "Plan one music mini-project with Meera (podcast pilot / kids' teaching session / archive)"),
  T("g8", "Explore", "Read 6 books across new subjects with one-line log"),
  T("g8", "Strategy", "Monthly Priya check-ins"),
  T("g8", "Music", "Ask guru about Cleveland Aradhana & Chennai youth circuits"),
  // g9 (Foundation)
  T("g9", "Academics", "95%+ trajectory begins; choose stream deliberately with Priya"),
  T("g9", "Writing", "John Locke Junior (<15)"),
  T("g9", "Competition", "First Panini Linguistics Olympiad attempt"),
  T("g9", "Competition", "IJSO pathway attempt (IOQ)"),
  T("g9", "Writing", "One NYT student contest"),
  T("g9", "Strategy", "Ship artifact #1 publicly"),
  T("g9", "Music", "First youth-circuit music competition (guru's call)"),
  T("g9", "Strategy", "Choose 2 long-run recommenders; send first March \"year in review\" note"),
  T("g9", "Competition", "Try Technovation Girls (music-tech-for-good angle)"),
  // g10 (Depth)
  T("g10", "Academics", "SAT diagnostic (year-end)"),
  T("g10", "Competition", "Olympiad ladder seriously in best subject"),
  T("g10", "Competition", "Breakthrough Junior Challenge video"),
  T("g10", "Writing", "Begin Concord Review–grade research paper (music history angle candidate)"),
  T("g10", "Explore", "Send 10 cold emails for research mentorship (music cognition / computational musicology labs)"),
  T("g10", "Music", "Arangetram window — document professionally"),
  T("g10", "Strategy", "Shortlist SSP / TASS / PROMYS India; note Dec–Feb deadlines"),
  T("g10", "Strategy", "Visit EducationUSA center"),
  // g11 (Leadership)
  T("g11", "Academics", "Peak rigor; real SAT attempts → 1550+ target"),
  T("g11", "Strategy", "Apply RSI / SSP / TASS (Dec–Feb!)"),
  T("g11", "Competition", "International-round competition pushes; IRIS→ISEF if research took hold"),
  T("g11", "Writing", "Complete & submit mentored research paper"),
  T("g11", "Music", "Finalize arts-supplement recordings"),
  T("g11", "Strategy", "Build college list around funding map (9 need-blind + merit schools + Tata-Cornell)"),
  T("g11", "Strategy", "Consider hiring human counselor for final-mile review"),
  // g12 (Applications)
  T("g12", "Academics", "Hold grades through boards"),
  T("g12", "Strategy", "ED/EA at a need-blind school (decide with family + counselor)"),
  T("g12", "Strategy", "CSS Profile EARLY with consistent documents"),
  T("g12", "Strategy", "12–14 applications"),
  T("g12", "Writing", "Essays: her drafts, Dev's protocol feedback only"),
  T("g12", "Music", "Submit arts supplement"),
  // dec (Decisions)
  T("dec", "Strategy", "Compare aid offers side by side"),
  T("dec", "Strategy", "Never accept pressure deadlines without checking options"),
  // uni (University)
  T("uni", "Strategy", "Celebrate. Export portfolio as the record of five years."),
];

async function seedRoadmap() {
  const count = await prisma.task.count({ where: { source: "seed" } });
  if (count > 0) return; // idempotent
  await prisma.task.createMany({
    data: ROADMAP.map((t) => ({ ...t, status: "todo", source: "seed" })),
  });
}

// ---------------------------------------------------------------- §6.3 Deadline Radar
type SeedDeadline = {
  name: string;
  typicalWindow: string;
  eligibility: string;
  url: string;
  relevantFromGrade: number;
  category: string;
};

const DEADLINES: SeedDeadline[] = [
  {
    name: "Queen's Commonwealth Essay Competition (Junior)",
    typicalWindow: "Feb–Jun",
    eligibility: "Junior category: under 14. Senior: 14–18.",
    url: "https://www.royalcwsociety.org/essay-competition",
    relevantFromGrade: 8,
    category: "Writing",
  },
  {
    name: "John Locke Institute Junior Prize",
    typicalWindow: "Apr–Jun",
    eligibility: "Under 15 on the registration deadline.",
    url: "https://www.johnlockeinstitute.com/essay-competition",
    relevantFromGrade: 8,
    category: "Writing",
  },
  {
    name: "Panini Linguistics Olympiad",
    typicalWindow: "Rounds ~Aug–Jan",
    eligibility: "Indian school students; leads to International Linguistics Olympiad.",
    url: "https://ploindia.com",
    relevantFromGrade: 8,
    category: "Competition",
  },
  {
    name: "IJSO via IOQ (HBCSE)",
    typicalWindow: "Registration ~Aug–Sep",
    eligibility: "Under 16 for IJSO; via IOQ exams in India.",
    url: "https://olympiads.hbcse.tifr.res.in",
    relevantFromGrade: 8,
    category: "Competition",
  },
  {
    name: "NYT Student Contests",
    typicalWindow: "Rolling — several per year",
    eligibility: "International students welcome; check each contest's age rule.",
    url: "https://www.nytimes.com/spotlight/student-contests",
    relevantFromGrade: 8,
    category: "Writing",
  },
  {
    name: "Technovation Girls",
    typicalWindow: "Oct–Apr season",
    eligibility: "Girls-only app challenge; junior division 13–15.",
    url: "https://technovationchallenge.org",
    relevantFromGrade: 8,
    category: "Competition",
  },
  {
    name: "Breakthrough Junior Challenge",
    typicalWindow: "Apr–Jun",
    eligibility: "Ages 13–18. 2-minute science-explainer video.",
    url: "https://breakthroughjuniorchallenge.org",
    relevantFromGrade: 8,
    category: "Competition",
  },
  {
    name: "IRIS National Fair",
    typicalWindow: "~Jul–Sep",
    eligibility: "India's route to ISEF; Grades 5–12.",
    url: "https://irisnationalfair.org",
    relevantFromGrade: 9,
    category: "Competition",
  },
  {
    name: "The Concord Review",
    typicalWindow: "Quarterly submissions",
    eligibility: "Serious history research papers by secondary students.",
    url: "https://www.tcr.org",
    relevantFromGrade: 10,
    category: "Writing",
  },
  {
    name: "RSI (Research Science Institute)",
    typicalWindow: "Opens Oct, closes mid-Dec–Jan",
    eligibility: "Grade 11 (apply in 11th for the summer before 12th). ~2.5% acceptance. Free.",
    url: "https://www.cee.org/programs/research-science-institute",
    relevantFromGrade: 10,
    category: "Strategy",
  },
  {
    name: "SSP (Summer Science Program)",
    typicalWindow: "Dec–Feb",
    eligibility: "Grade 11; international applicants need visa by deadline. Need-based aid.",
    url: "https://summerscience.org",
    relevantFromGrade: 10,
    category: "Strategy",
  },
  {
    name: "TASS (Telluride Association Summer Seminar)",
    typicalWindow: "Nov–Jan",
    eligibility: "Grades 10–11. Free, including travel aid.",
    url: "https://www.tellurideassociation.org/our-programs/high-school-students",
    relevantFromGrade: 9,
    category: "Strategy",
  },
  {
    name: "PROMYS India (IISc)",
    typicalWindow: "~Mar",
    eligibility: "Ages 13–19; mathematically ambitious pre-university students.",
    url: "https://promys-india.org",
    relevantFromGrade: 9,
    category: "Competition",
  },
  {
    name: "SAT (international dates)",
    typicalWindow: "7 dates/year internationally",
    eligibility: "Take a diagnostic end of Grade 10; real attempts Grade 11.",
    url: "https://satsuite.collegeboard.org/sat/registration/international-registration",
    relevantFromGrade: 10,
    category: "Academics",
  },
  {
    name: "Cleveland Thyagaraja Aradhana — youth competitions",
    typicalWindow: "Early in the year (festival ~Mar–Apr)",
    eligibility: "Youth categories by age; confirm entry with guru.",
    url: "https://aradhana.org",
    relevantFromGrade: 8,
    category: "Music",
  },
  {
    name: "All India Radio graded-artist audition",
    typicalWindow: "Check regional station schedule",
    eligibility: "Check current age rule; discuss with guru first.",
    url: "https://prasarbharati.gov.in",
    relevantFromGrade: 9,
    category: "Music",
  },
];

async function seedDeadlines() {
  const count = await prisma.deadline.count();
  if (count > 0) return; // idempotent
  await prisma.deadline.createMany({ data: DEADLINES });
}

async function main() {
  await seedProfiles();
  await seedMentors();
  await seedRoadmap();
  await seedDeadlines();
  console.log("Seed complete: 2 profiles, 5 mentors, roadmap tasks, deadline radar.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
