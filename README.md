# Pathfinder v2

A private AI mentorship app for Sarvagna — Grade 8 → University, 2026–2031.
Built from the specification in [`CLAUDE.md`](./CLAUDE.md); Phase 1 details in
[`docs/BUILD_NOTES.md`](./docs/BUILD_NOTES.md).

Five AI mentors (strategy, music, competitions, writing, exploration) with
persistent memory, a goal roadmap tracked on the seven-swara **Arohanam**, a
"Wins & Sparks" journal, deadline alerts, and a parent view that shows
progress without surveillance. Coach, don't do: the mentors never write her
work.

## Quick start

```bash
cp .env.example .env       # add your ANTHROPIC_API_KEY
npm install
npm run db:push && npm run db:seed
npm run dev                # http://localhost:3000
```

Seeded PINs (change in `.env` before seeding): Sarvagna `1213`, Parent `2026`.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind (custom "Kutcheri" tokens) ·
Prisma + SQLite · Anthropic API (`claude-sonnet-4-6` chat, `claude-haiku-4-5`
background) · Vitest + Playwright.

## Tests

```bash
npm test          # unit tests (streaks, stages, prompt builders)
npm run test:e2e  # Playwright smoke test (login → mentor chat → reply)
```
