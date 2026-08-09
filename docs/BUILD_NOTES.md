# Pathfinder v2 — Phase 1 Build Notes

## What Phase 1 delivers

Phase 1 is the working core of the app described in `CLAUDE.md`:

- **Project scaffold** — Next.js 14 (App Router) + TypeScript, mobile-first
  installable PWA, Tailwind with the Kutcheri tokens, SQLite via Prisma.
- **Two-profile PIN auth** — Sarvagna / Parent, scrypt-hashed PINs, httpOnly
  session cookie, no external provider.
- **The five mentors** — persistent chats with the verbatim §2.2 personas,
  composed as `BASE_RULES + PERSONA + LIVE_CONTEXT` per §2.1. Chat runs on
  `claude-sonnet-4-6`; background work on `claude-haiku-4-5` (both
  overridable via env).
- **Mentor memory (§2.3)** — sessions idle >30 min (or explicitly closed via
  `POST /api/chat/close`) are summarized by Haiku; a rolling ≤400-word memory
  per mentor is merged, and extracted commitments land as `suggested` goals
  that need her tap to accept.
- **Dashboard ("Today")** — greeting, the Arohanam tracker (seven ascending
  swara nodes, current stage highlighted, progress from goals done in the
  stage), top-3 open goals, deadline alerts within 45 days, capstone-mix
  meter, activity streak.
- **Roadmap** — goals grouped by stage, add/complete/accept/skip.
- **Wins & Sparks journal** — the essay-seed corpus Dev's persona relies on.
- **Parent view** — goals, streaks, capstone mix, per-mentor session
  summaries, with the explicit "never her raw chat transcripts" statement.
- **Tests** — 22 Vitest unit tests (streak logic, stage/capstone math, prompt
  builders) and one Playwright smoke test (login → mentor chat → send →
  reply/graceful error).

## The truncated spec, and what was reconstructed

The source document arrived cut off mid-§3.1 (see the transmission note at
the bottom of `CLAUDE.md`). Sections §3.2+, §5 (schema), §8 (design tokens),
seeded content, and the phased build plan were reconstructed from the
surviving text's forward references. When the missing sections are recovered,
they supersede these interpretations.

### §5 — Database schema (reconstructed)

Entities were derived from explicit references in §§0–3.1: two PIN-auth
profiles, the student profile fields named in the §2.1 template
(`interests`, `strengths`, `notes`, `thread`, grade), per-mentor chat
messages and rolling `memory_summary`, goals with `suggested` status and
stage + capstone-type tagging, the "Wins & Sparks" journal, deadlines, and
activity days for streaks. See `prisma/schema.prisma`.

### §8 — "Kutcheri" design tokens (reconstructed)

The five mentor color names (peacock, madder, marigold, slate, plum) are
specified in §2's table; the palette values, the silk/ink/gold neutrals, and
the serif-display/sans-body pairing are interpretations in the spirit of the
name (a Carnatic concert: silk, ink, gold). See `tailwind.config.ts`. The
Arohanam tracker maps the journey to the seven swaras:
Sa = Grade 8 … Pa = Grade 12, Dha = Applications, Ni = University.

### Phase plan (reconstructed)

- **Phase 1 (this build):** scaffold, design system, DB, auth, the five
  mentors with memory, dashboard, roadmap, journal, parent view, tests.
- **Phase 2 (suggested next):** streaming chat responses, profile/thread
  editor, deadline CRUD + more seeded competition calendar, practice/
  performance log for Meera, PIE-check and swim-lane-audit structured flows.
- **Phase 3 (suggested):** repertoire/recording archive (arts supplement),
  monthly check-in cadence automation for Priya, essay-seed mining views for
  Dev, data export, optional Vercel + Turso deployment.

## Running locally

```bash
cp .env.example .env       # add your real ANTHROPIC_API_KEY
npm install                # also runs prisma generate
npm run db:push && npm run db:seed
npm run dev                # http://localhost:3000
```

Default seeded PINs (change via `SEED_STUDENT_PIN` / `SEED_PARENT_PIN` in
`.env` before seeding): Sarvagna `1213`, Parent `2026`.

Tests: `npm test` (Vitest) and `npm run test:e2e` (Playwright; set
`PLAYWRIGHT_CHROMIUM_PATH` if your environment pre-installs Chromium at a
fixed path). Without an `ANTHROPIC_API_KEY`, the smoke test asserts the
graceful error path instead of a live mentor reply.
