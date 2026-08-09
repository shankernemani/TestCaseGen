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

- **Phase 1:** scaffold, design system, DB, auth, the five mentors with
  memory, dashboard, roadmap, journal, parent view, tests. ✅ shipped
- **Phase 2:** streaming replies, idle-session memory sweep, profile/thread
  editor, Carnatic practice log, deadline management + seeded competition
  calendar, Priya's monthly check-in cadence, JSON backup export. ✅ shipped
  (details below)
- **Phase 3 (suggested):** repertoire/recording archive (arts supplement),
  essay-seed mining views for Dev, PIE-check / swim-lane structured flows if
  the conversational versions prove insufficient, optional Vercel + Turso
  deployment with automated backups.

## Phase 2 details

- **Streaming chat** — `/api/chat` now streams text deltas (plain-text body);
  the first stream event is awaited server-side so auth/connection failures
  still return clean JSON errors. Messages persist after the stream completes.
- **Memory sweep** — `POST /api/memory/sweep` closes idle sessions for every
  mentor; fired in the background whenever the dashboard or parent view
  loads (`MemorySweeper`). Fixes the Phase 1 gap where a mentor's session
  only got summarized when she reopened that same mentor.
- **Profile editor** — `/settings`: thread, grade, interests, strengths,
  notes (Anaya's "suggest she edit it" now has a destination). Grade drives
  the Arohanam stage and mentor age-window context.
- **Practice log** — `/practice` (new bottom-nav tab): quick entry, weekly
  totals, entries feed the activity streak, and a 7-day summary is injected
  into Meera's prompt context (`HER PRACTICE LOG: …`).
- **Deadlines** — `/deadlines`: add/delete with links; the dashboard's
  45-day "Coming up" card links to it. The seed now carries a nine-entry
  competition calendar from Arjun's swim-lane map, every entry flagged
  "verify on the official site."
- **Monthly check-in** — closing a Priya session stamps
  `StudentProfile.lastCheckInAt`; the dashboard shows a check-in nudge when
  it's ≥30 days (or never), and Priya's prompt receives a
  `MONTHLY CHECK-IN STATUS` line.
- **Backup export** — `GET /api/export` returns a full JSON backup
  (Content-Disposition download). Per the §0.7 privacy rule, raw chat
  transcripts are included only in the student's own export, never the
  parent's. Buttons: parent view and `/settings`.

## Production-hardening pass

A multi-agent review (5 dimensions, adversarially verified) drove a fix
round covering:

- **Memory race** — `closeIdleSession` now serializes per mentor
  (in-process) and commits through a guarded interactive transaction: the
  `summarized`-flag update doubles as the lock, so concurrent sweep/chat/
  close calls can no longer double-summarize a session or duplicate
  suggested goals.
- **NULL ordering** — SQLite sorts `NULL` first, so undated goals were
  crowding imminent deadlines out of the mentors' top-6 context and the
  dashboard's top-3. All goal queries now order `dueDate` nulls-last.
- **Streaming durability** — the mentor's reply is consumed and persisted
  independently of the client connection (locking the phone mid-reply no
  longer loses the message); hard `max_tokens` cutoffs are marked with "…".
- **Chat client** — send stays disabled for the whole stream (no concurrent
  streams corrupting the transcript), failed sends roll back the optimistic
  bubble and restore the typed text, auto-scroll yields when she scrolls up,
  and leaving the app fires the §2.3 explicit-close beacon.
- **Auth** — login gets a 5-failure / 5-minute lockout per profile; a
  PIN-change form (Profile page and parent view) backed by
  `POST /api/auth/pin`; re-seeding with `SEED_*_PIN` set now actually
  rotates the PIN (defaults never overwrite a changed PIN).
- **Goal integrity** — status transitions are validated server-side
  (accept only from `suggested`, etc.), `completedAt` is cleared on
  non-complete transitions, and goal mutation is student-only, so accepting
  a mentor suggestion is genuinely *her* tap (§2.3).
- **Privacy** — the parent's backup export now also excludes the
  Wins & Sparks journal (her words, like her transcripts); the parent view's
  session summaries show the real ≤120-word session summary (now stored on
  `MentorMemory.lastSessionSummary`) instead of the rolling memory.
- **Context windowing** — sessions that outgrow the 30-message window are
  force-closed into memory (no lost middle); the history window never starts
  on an assistant turn (API 400); the summary prompt is bounded (last 80
  messages, 4k chars each) and its Haiku call got headroom (2048 tokens).
- **Misc** — deadlines stay visible through their whole due day (IST),
  prompt rule 9 marks injected student content as data-not-instructions,
  forms recover from network failures instead of sticking `busy`, pinch-zoom
  restored, keyboard no longer covers the chat composer on Android, age in
  prompts matches the spec's "about 13", delete-deadline asks first.

A second adversarial pass over the fix diff itself then caught and resolved:
the login lockout never resetting after expiry (one wrong PIN would re-lock
forever), session closes racing in-flight reply persistence (closes now wait
for the reply to land, and abort cleanly on overlapping transcripts), force
closes being coalesced into in-flight non-force closes, the pagehide close
beacon (removed — it fired on reloads, killing live sessions, but not on
mobile backgrounding; the idle sweep covers §2.3), the empty-reply rollback
duplicating already-persisted user turns, seed PIN rotation requiring an
explicit `SEED_ROTATE_PINS=1` so stale `.env` vars can't clobber an in-app
PIN change, goal-conflict errors (409) now surfaced in the UI, and the
parent backup being labeled as excluding her journal/transcripts.

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
