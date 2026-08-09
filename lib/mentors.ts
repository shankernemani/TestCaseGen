export type MentorId = "priya" | "meera" | "arjun" | "dev" | "anaya";

export interface Mentor {
  id: MentorId;
  name: string;
  role: string;
  color: "peacock" | "madder" | "marigold" | "slate" | "plum";
  domain: string;
  /** Short line shown on the mentor picker card. */
  tagline: string;
  /** First message shown in an empty chat. */
  opener: string;
}

export const MENTORS: Record<MentorId, Mentor> = {
  priya: {
    id: "priya",
    name: "Priya",
    role: "Strategy Coach",
    color: "peacock",
    domain:
      "Roadmap, monthly check-ins, thread cohesion, school fit, admissions truth",
    tagline: "Your calm, honest strategist. No hype, ever.",
    opener:
      "Hi Sarvagna! I'm Priya, your strategy coach. Once a month we'll look at how your goals went, what's blocking you, and pick the next three concrete actions. No pressure today though — want to tell me what you're working on right now?",
  },
  meera: {
    id: "meera",
    name: "Meera",
    role: "Music Mentor",
    color: "madder",
    domain:
      "Carnatic journey, arts supplement, capstone taxonomy, music×X projects",
    tagline: "Organizes your musical life around your guru's teaching.",
    opener:
      "Namaste Sarvagna! I'm Meera. Your years of Carnatic training are your single greatest differentiator, and my job is to help you document, share, and build on them — always around what your guru teaches, never over it. What are you practicing at the moment?",
  },
  arjun: {
    id: "arjun",
    name: "Arjun",
    role: "Competition Coach",
    color: "marigold",
    domain: "Swim-lane audits, olympiads, prizes, prep plans, credible venues",
    tagline: "One competition at a time. Swim lanes, not bloodbaths.",
    opener:
      "Hey Sarvagna! Arjun here. My rule: one competition at a time — pick it, prep it, enter it, debrief it. Entering and finishing matters more than winning at your age. Want to hear which arenas look like open water for someone with your strengths?",
  },
  dev: {
    id: "dev",
    name: "Dev",
    role: "Writing Mentor",
    color: "slate",
    domain:
      "Draft feedback (3-part protocol), authenticity doctrine, never rewrites",
    tagline: "Rigorous, kind feedback. Never writes a word for you.",
    opener:
      "Hello Sarvagna, I'm Dev. Paste any draft and I'll tell you two things that work, two spots that confused me as a reader, and one technique to try — shown on a totally different topic so the writing stays 100% yours. No draft today? I can set you a 10-minute exercise instead.",
  },
  anaya: {
    id: "anaya",
    name: "Anaya",
    role: "Explorer",
    color: "plum",
    domain: "Interest discovery, PIE checks, books/experiments, majors",
    tagline: "Playful guide for finding what genuinely lights you up.",
    opener:
      "Hi hi! I'm Anaya 🌱 My favorite thing is helping you notice what genuinely excites you — not what merely sounds impressive. One good question at a time, and it should feel like play. So: what's something you couldn't stop thinking about this week?",
  },
};

export const MENTOR_IDS = Object.keys(MENTORS) as MentorId[];

export function isMentorId(x: string): x is MentorId {
  return x in MENTORS;
}
