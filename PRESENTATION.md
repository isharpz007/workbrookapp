# Workbrook Memory — Progress Report

*A free public record of who helped people land work. No accounts needed for
the core flows; private by default; consent first.*

---

## What the app does

- Anyone can record a work memory in under a minute — **only the year is required**
- Two directions: **"Someone helped me"** or **"I helped someone"**
- Entries stay **private by default** until the author chooses to share them
- A **named person** gets an email and can **confirm, keep private, or remove** the entry — one click, no login
- The public wall is **browsable but never indexed** by search engines, and unconfirmed names appear as initials only
- Authors manage entries through **private manage links** — edit, delete, or export a CSV of everything

---

## Built so far (all plan stages)

| Stage | Status |
|---|---|
| Data model & privacy rules (hashed secrets, no surnames, stop-email list) | ✅ Done |
| Add a memory — form, live sentence preview, private manage link | ✅ Done |
| Public pages — list, search, filters, detail, "say thank you", report | ✅ Done |
| Consent & email — confirm / keep private / remove via one-time links | ✅ Done |
| Manage & export — edit, delete, CSV download | ✅ Done |
| Harden & launch — rate limits, Turnstile, tests, PWA | ✅ Done |

---

## Work completed in this phase

### Profile page — Work memories as testimonials
- The profile's **"Work memories"** section now shows real entries as
  **testimonial-style review cards** — quote icon, the memory sentence, job ·
  year · place as attribution, and a Confirmed/"Not yet confirmed" badge as the
  verified mark
- Grouped into **"People who helped me"** and **"People I helped"**
- Each card links to its private manage page; empty state links to add a memory

### Real data only
- Removed all dummy/example data from the home page — it now shows **only real
  public entries** from the database, with a friendly empty state

### Installable PWA
- Web app **manifest** (standalone display, brand theme color)
- **Service worker**: static assets cached, pages network-first with an
  offline notice — no offline writes, keeping consent flows truthful
- Generated **brand icons** (192/512, including maskable) via a repeatable
  script

### Email anti-abuse (per the plan's defaults)
- **Per-recipient daily cap** — max 3 emails/day to any one address, enforced
  server-side (the owner's report notice is deliberately uncapped so abuse
  reports can't be silenced)
- **"Stop emailing me" footer** in every user-facing email → one-click link
  that adds the address hash to the suppression list — no login needed

### Emailed CSV export
- From the manage page: **"Email me the CSV"** sends a **one-time, 15-minute**
  download link to the entry's author address (`/api/export?token=…`)

### Test suite — the plan's required cases
`npm test` — **15 tests, all passing**:

- ✅ Links work once, then expire (token consume + mark-used)
- ✅ Reports hide entries immediately; hidden/removed/private never reach the wall
- ✅ Rate limits trigger on the N+1th call
- ✅ Surnames, emails and secrets **never appear** in API output
- ✅ Future/impossible dates rejected; links stripped from text; only year required

### Code quality
- Lint: **0 errors** (converted localStorage hydration to `useSyncExternalStore` —
  profile data now syncs across browser tabs)
- Typecheck: **clean**
- Test command added: `npm test` (Vitest)

---

## Architecture (as planned)

```
Next.js 16 (App Router, TS) ──► Supabase Postgres (Drizzle ORM)
Tailwind + shadcn/ui        ──► Resend (fixed email templates)
Zustand (local manage links)──► Cloudflare Turnstile (human check)
react-hook-form + zod       ──► Vercel (hosting)
```

**Privacy boundary:** `toPublicMemory()` is the only way memory data reaches
the client — emails, secrets and surnames can never leak.

---

## Still to do

- Deploy to Vercel + wire Supabase env vars (staging first)
- Playwright end-to-end smoke pass (add → consent → confirmed; report → hidden)
- WCAG 2.2 AA accessibility audit
- The open decision from the plan: retention/deletion/legal wording for
  third-party personal data

---

## Verify it yourself

```bash
npm run dev    # run the app
npm test       # 15 tests — privacy, tokens, reports, rate limits
npm run lint   # 0 errors
npx tsc --noEmit  # clean typecheck
```
