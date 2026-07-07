# Pathfinder

A private AI mentorship app for Sarvagna's journey — Grade 8 to university (2026–2031).
Built as a thoughtful, near-zero-cost alternative to a ₹30-lakh admissions consultancy.

**Coach, don't do.** The five mentors give feedback, structure, and questions — they never
write her essays, entries, or projects. Honest admissions, age-appropriate tone, parent
visibility without surveillance.

## The five mentors

| Mentor | Role | Domain |
| --- | --- | --- |
| **Priya** | Strategy Coach | Roadmap, monthly check-ins, admissions truth |
| **Meera** | Music Mentor | Carnatic journey, arts supplement, music×X projects |
| **Arjun** | Competition Coach | Olympiads, essay prizes, prep plans |
| **Dev** | Writing Mentor | 3-part draft feedback protocol — never rewrites |
| **Anaya** | Explorer | Interest discovery, the PIE check, majors |

## Getting started

```bash
npm install
cp .env.example .env        # add your ANTHROPIC_API_KEY
npx prisma migrate dev      # creates prisma/dev.db
npx prisma db seed          # profiles, mentors, roadmap, deadline radar
npm run dev                 # http://localhost:3000
```

Default PINs (change via `SEED_STUDENT_PIN` / `SEED_PARENT_PIN` in `.env` **before**
seeding): Sarvagna `1008`, Parent `2653`.

Without an API key the app still runs — roadmap, practice log, journal, portfolio, and the
safety short-circuits all work; mentors reply with a friendly "ask Appa to add the key".

## What's inside

- **Today** — Arohanam tracker (7 swara nodes, Sa→Ni), top-3 goals, deadline radar alerts
  (≤45 days), practice streak flame, mentor quick-launch, Monday check-in + Friday journal
  nudges.
- **Mentor chat** — full-screen streaming chat (SSE), per-mentor rolling memory (≤400 words,
  Haiku-merged), session summaries + commitment extraction → suggested roadmap tasks,
  suggested-task chips, 60-messages/day gentle rate limit.
- **Roadmap** — 7 stages seeded from Grade 8 to university; by-stage accordion and
  next-30-days views; completing a task prompts for an artifact link.
- **Deadline radar** — 16 seeded annual windows (QCEC, John Locke, Panini, RSI, SSP, TASS…)
  with eligibility computed against her grade; parent edits dates yearly.
- **Proof Locker** — portfolio + repertoire/performance logs; Markdown export with Common
  App draft mode (real character limits, vagueness flagging).
- **Practice log & journal** — one-tap daily minutes, streaks, weekly chart, wins & sparks.
- **Parent view** — read-only progress, session summaries (never transcripts — stated
  explicitly), monthly Haiku brief, deadline editing, Honest Notes (funding map, bright
  lines, when to hire a human).

## Safety (code, not just prompts) — `lib/safety.ts`

- Ghostwriting requests short-circuit to a coaching-decline template before any API call.
- Sensitive topics get a kind redirect + a quiet "Talk to Amma/Appa?" card; those messages
  are flagged and never enter mentor memory.
- Replies over 250 words trigger instruction pressure on the next turn.
- All prompts live in `lib/prompts.ts` — single source of truth, easy to tune.

## Tests

```bash
npm test   # Vitest: streak logic, prompt builders, safety guards (36 tests)
```

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind (custom "Kutcheri" tokens) · Prisma +
SQLite · Anthropic API (Sonnet for chat, Haiku for background) · PWA manifest. Deploys
locally today; Vercel + Turso later.

## What this app deliberately does NOT do

No admission predictions or "chancing". No fabricated titles or activities. No essay
ghostwriting under any prompt phrasing. No replacement for her guru, her teachers, real
judges, recommenders, or a human counselor's final-mile review in Grades 11–12.
