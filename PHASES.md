# Workbrook Memory — Build Phases

Each phase ends in a working, deployable state. Order follows the project
plan's build order; consent ships *before* the public wall so no named person
is ever exposed without a way out.

## Phase 1 — Foundation ✅

- Next.js 15 scaffold (TS, Tailwind, App Router, `src/`)
- shadcn/ui + design tokens (brand blue `#3b6fd8`, Poppins)
- App shell: royal-blue sidebar → mobile Sheet
- Drizzle schema + Supabase Postgres client (`memories`, `action_tokens`, `reports`,
  `stop_emails`, `rate_limits`)
- `toPublicMemory()` serializer — the only path data takes to the client
- zod validators, hash/token utils, sentence builder

## Phase 2 — Add a memory ✅

- `/add` form: direction toggle → job + year → name + city/region
- Live sentence preview (Framer Motion)
- `createMemory` server action → hashed manage secret → "save your link"
  warning + download + Zustand `manage-links` store

## Phase 3 — Consent & email ✅

- Resend + react-email templates (consent, recovery, report, export)
- `/named/[token]` — Confirm / Keep private / Remove (one-time token)
- Report dialog → auto-hide + owner email
- Cloudflare Turnstile on all public mutations + rate limits

## Phase 4 — Public pages ✅

- `/memories` list, search, filters (year, job, place, status)
- `/memories/[id]` detail — say thank you, report
- `noindex` on all memory routes; initials-only for unconfirmed
- Home page live search

## Phase 5 — Manage & export ✅

- `/my-entries` from local manage links + email recovery flow
- `/manage/[token]` edit/delete; edits reset confirmed → pending + re-send
- `/api/export` — CSV of own entries (one-time token)

## Phase 6 — Harden & launch

- WCAG 2.2 AA pass, `prefers-reduced-motion`
- Vitest suite (token single-use, report-hides, rate limits, no-surname API)
- Playwright smoke on a Supabase branch
- Serwist PWA (manifest + service worker)
- Admin reports page, staging deploy, launch checklist
