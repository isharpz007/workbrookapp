# Workbrook Memory — Implementation Guide

How to build the Workbrook Memory app described in the project plan, using a
Next.js full-stack codebase deployed on Vercel with a Neon Postgres database.

---

## 1. Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router, TypeScript) | One codebase for UI + backend; server actions and route handlers keep secrets off the client |
| Database | Neon serverless Postgres (Vercel Marketplace integration) | Managed Postgres with per-branch preview DBs; HTTP driver suits serverless |
| ORM | Drizzle ORM + drizzle-kit | Lightweight, SQL-first, pairs natively with `@neondatabase/serverless` |
| Styling | Tailwind CSS + shadcn/ui | Matches the plan's rounded-card design language; accessible primitives |
| Icons | lucide-react | shadcn's default icon set |
| Animation | Framer Motion (`motion`) | Card/page transitions, preview sentence reveal |
| Client state | Zustand | Form draft, locally-stored manage links, sidebar UI state |
| Forms | react-hook-form + zod | Validation shared client/server |
| Email | Resend + react-email | Fixed transactional templates only |
| Bot check | Cloudflare Turnstile | No trackers, required by the plan |
| PWA | Serwist (`@serwist/next`) | Maintained service-worker toolkit for App Router; enables "installable" requirement |
| Tests | Vitest + Playwright | Unit/API tests + a small e2e smoke pass |
| Hosting | Vercel | Required by the plan |

Alternatives considered: Prisma works too but is heavier on serverless cold
starts; `@upstash/ratelimit` can replace the DB rate-limit table later if
traffic grows.

---

## 2. Project scaffold

```bash
npx create-next-app@latest workbrook-memory \
  --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

cd workbrook-memory

# UI
npx shadcn@latest init
npx shadcn@latest add button card input select textarea badge tabs \
  sheet dialog dropdown-menu table skeleton separator sonner label

# App libraries
npm install drizzle-orm @neondatabase/serverless zod react-hook-form \
  @hookform/resolvers zustand motion lucide-react \
  resend react-email @react-email/components \
  @marsidev/react-turnstile nanoid

npm install -D drizzle-kit vitest @vitejs/plugin-react \
  @testing-library/react @testing-library/jest-dom jsdom \
  playwright @serwist/next serwist
```

Design tokens (from the plan) go in `globals.css` / Tailwind theme:

```css
--brand:        #3b6fd8;  /* royal blue sidebar   */
--link:         #2e6bd6;
--accent:       #d4a62a;  /* gold                 */
--confirmed:    #1e8e5a;  /* green badge          */
--background:   #f5f7fb;
--foreground:   #1f2430;
```

Font: **Poppins** via `next/font/google`, rounded sans-serif.

---

## 3. Data model (Drizzle schema)

`src/db/schema.ts`

```ts
import { pgTable, pgEnum, uuid, text, smallint, timestamp,
         boolean, integer, index } from "drizzle-orm/pg-core";

export const directionEnum = pgEnum("direction", [
  "someone_helped_me",
  "i_helped_someone",
]);

export const statusEnum = pgEnum("status", [
  "private",            // author chose "Only me"
  "pending_consent",    // shared; named person hasn't responded
  "confirmed",          // named person confirmed
  "hidden",             // auto-hidden by a report, awaiting review
  "removed",            // removed by named person or author
]);

export const memories = pgTable("memories", {
  id: uuid("id").defaultRandom().primaryKey(),

  direction: directionEnum("direction").notNull(),

  // The named person — only first name + last initial are EVER public
  personFirstName:   text("person_first_name").notNull(),
  personLastInitial: text("person_last_initial").notNull(),
  personCity:        text("person_city"),
  personRegion:      text("person_region"),

  jobTitle: text("job_title").notNull(),
  year:     smallint("year").notNull(),

  status: statusEnum("status").notNull().default("private"),

  // Private contact data — never selected into public queries
  authorEmail: text("author_email"),        // manage-link recovery + export
  personEmail: text("person_email"),        // consent outreach

  // Hashed secrets — the raw values live only in URLs
  manageSecretHash: text("manage_secret_hash").notNull(),

  confirmedAt: timestamp("confirmed_at"),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
  updatedAt:   timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("memories_status_idx").on(t.status),
  index("memories_year_idx").on(t.year),
  index("memories_person_name_idx").on(t.personFirstName, t.personCity),
]);

// One-time links: consent response, email recovery, export download
export const actionTokens = pgTable("action_tokens", {
  id:        uuid("id").defaultRandom().primaryKey(),
  memoryId:  uuid("memory_id").references(() => memories.id,
             { onDelete: "cascade" }),
  purpose:   text("purpose").notNull(),   // consent | recover | export
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt:    timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [index("tokens_memory_idx").on(t.memoryId)]);

export const reports = pgTable("reports", {
  id:        uuid("id").defaultRandom().primaryKey(),
  memoryId:  uuid("memory_id").references(() => memories.id,
             { onDelete: "cascade" }).notNull(),
  reason:    text("reason").notNull(),     // fixed enum list in UI
  details:   text("details"),              // length-limited, no links
  status:    text("status").notNull().default("open"), // open | resolved
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stopEmails = pgTable("stop_emails", {
  emailHash: text("email_hash").primaryKey(), // sha256(lower(email))
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rateLimits = pgTable("rate_limits", {
  key:         text("key").primaryKey(),  // e.g. "add:ip:1.2.3.4:2026-11-03"
  count:       integer("count").notNull().default(0),
  windowStart: timestamp("window_start").defaultNow().notNull(),
});
```

Security rules baked into the schema:

- **Surnames are never stored** — only `personLastInitial`. There is no column
  that could leak.
- **Secrets are hashed** (`sha256`, hex) — `manageSecretHash`,
  `actionTokens.tokenHash`, `stopEmails.emailHash`. Raw secrets appear only in
  URLs the user holds.
- **One-time links** — every `actionToken` has `expiresAt` + `usedAt`; mark
  `used_at` inside the same transaction that performs the action.
- **Cascade deletes** — removing a memory removes its tokens and reports.

---

## 4. The public serializer (the privacy boundary)

One function is the ONLY way memory data reaches the client. Everything public
goes through it, so contact details and full names can never leak:

```ts
// src/lib/public-memory.ts
export function toPublicMemory(m: typeof memories.$inferSelect) {
  const confirmed = m.status === "confirmed";
  return {
    id: m.id,
    // unconfirmed → initials only, e.g. "A. O."
    personName: confirmed
      ? `${m.personFirstName} ${m.personLastInitial}.`
      : `${m.personFirstName[0]}. ${m.personLastInitial}.`,
    sentence: buildSentence(m),          // "Ada O. from Lagos helped me find work."
    jobTitle: m.jobTitle,
    year: m.year,
    city: m.personCity,
    region: m.personRegion,
    status: confirmed ? "confirmed" : "not_yet_confirmed",
  };
  // NOTE: authorEmail, personEmail, manageSecretHash are never returned.
}
```

`buildSentence()` produces the single neutral phrasing from the plan:
`"I helped Chinedu O. from Abuja find work."` / `"Ada O. from Lagos helped me find work."`

Tests must assert `personEmail`, `authorEmail`, and any surname can never
appear in serialized output.

---

## 5. App structure

```
src/
  app/
    layout.tsx                  # Poppins, ThemeProvider, <Toaster/>, shell
    page.tsx                    # Home — search + two CTAs
    add/page.tsx                # Add a memory (form + live preview)
    memories/page.tsx           # List, search, filters
    memories/[id]/page.tsx      # Detail — say thank you, report
    my-entries/page.tsx         # Manage via secret or email recovery
    privacy/page.tsx            # Privacy policy + request-removal form
    named/[token]/page.tsx      # Consent landing — Confirm / Keep private / Remove
    manage/[token]/page.tsx     # Edit / delete own entry via manage link
    admin/reports/page.tsx      # Minimal review page (env-gated)
    api/
      export/route.ts           # GET — CSV of own entries (token in query)
      health/route.ts           # GET — uptime check
    robots.ts                   # noindex on /memories, /named, /manage
    manifest.ts                 # PWA manifest
    sitemap.ts                  # public pages only
  components/
    app-shell.tsx               # blue sidebar + white topbar + mobile Sheet
    memory-card.tsx             # sentence + status badge
    add-memory-form.tsx         # RHF + zod + Turnstile
    sentence-preview.tsx        # live preview (framer-motion animate)
    consent-actions.tsx         # Confirm / Keep private / Remove buttons
    report-dialog.tsx           # report form
    empty-state.tsx, status-badge.tsx, filters.tsx ...
  server/
    actions/
      memories.ts               # createMemory, updateMemory, deleteMemory
      consent.ts                # confirm, keepPrivate, removeEntry
      reports.ts                # submitReport, resolveReport
      recovery.ts               # requestManageLink (email), exportCsv
    queries.ts                  # all db reads; public reads use toPublicMemory
    email.ts                    # Resend sends — fixed templates only
    tokens.ts                   # mint/verify/consume hashed one-time tokens
    rate-limit.ts               # fixed-window counters in rate_limits table
    turnstile.ts                # server-side siteverify
    admin.ts                    # requireAdmin() — env key check
  stores/
    draft.ts                    # Zustand: in-progress form draft (persisted)
    manage-links.ts             # Zustand+persist: { memoryId: secret } in localStorage
    ui.ts                       # sidebar open, etc.
  db/
    schema.ts, client.ts        # neon() + drizzle()
  lib/
    public-memory.ts, sentence.ts, hash.ts, constants.ts
```

### Pages → plan mapping

| Route | Plan stage |
|---|---|
| `/` | Stage 3 — home with search + "Someone helped me" / "I helped someone" |
| `/add` | Stage 4 — direction toggle, job/year, name/city, live sentence preview |
| `/memories`, `/memories/[id]` | Stage 5 — list + detail with confirmed/not-yet badge |
| `/named/[token]` | Stage 6 — "Someone has named you" consent screen |
| `/my-entries`, `/manage/[token]` | Step 5 — edit, delete, CSV export |
| `app-shell` | Stage 2 — royal-blue sidebar → Sheet menu on phones |

---

## 6. Backend flows (server actions)

All mutations are `"use server"` actions. Every action follows the same
pipeline:

```
Turnstile verify → rate limit → zod validate → db tx → revalidatePath
```

### createMemory
1. Verify Turnstile token; check `add:{ip}` daily limit.
2. Validate: `year` ∈ 1950..current year (reject future/impossible dates),
   all text fields length-limited (name ≤ 60, city ≤ 80, job ≤ 80), strip URLs.
3. Mint `manageSecret` (nanoid 32) → store only `sha256(secret)`.
4. `status` = `private` (default) or `pending_consent` if shared publicly.
5. If `personEmail` given and not in `stop_emails`: mint a one-time
   `consent` token (7-day expiry) and email the consent link via Resend.
6. Return `{ id, manageSecret }` once — client stores it in the Zustand
   `manage-links` store and shows the "save this link" warning from the plan
   (no email + cleared storage = entry lost), plus a download offer.

### Consent (`/named/[token]`)
- `confirm` → `status = confirmed`, `confirmedAt = now()`, token consumed.
- `keepPrivate` → stays `pending_consent`, record choice, token consumed.
- `remove` → `status = removed`, add `personEmail` hash to `stop_emails`,
  token consumed.
- Each is a separate action; the page renders all three per the plan's mock.

### updateMemory
- Requires `manageSecret` (hash-compared server-side).
- **Editing a confirmed entry resets it to `pending_consent` and re-sends
  the consent email** — per the plan's "editing after confirmation" decision.

### submitReport
- Turnstile + `report:{ip}` limit → insert report → **set memory `hidden`
  immediately** → email site owner a review notice.

### requestManageLink
- Email-only. If address matches `authorEmail` and is not suppressed, send a
  one-time `recover` token link to `/manage/[token]`. Always respond with the
  same generic message (don't reveal whether the email exists).

### GET /api/export?token=…
- Validates a one-time `export` token → streams CSV of that author's own
  entries only.

### Admin
- `/admin/reports` gated by `requireAdmin()` comparing a bearer/header key to
  `ADMIN_KEY` env. Lists open reports with hidden entries; actions:
  restore (→ `pending_consent`) or confirm removal (→ `removed`).

---

## 7. Email (Resend + react-email)

Fixed templates only — no user text is ever interpolated into an email body
beyond the auto-generated sentence. Templates in `src/emails/`:

1. **consent-request** — "Someone has named you." + the sentence + link to
   `/named/[token]` (Confirm / Keep private / Remove).
2. **manage-link** — recovery link to `/manage/[token]`.
3. **report-notice** — to the site owner: entry ID, reason, link to admin.
4. **export-ready** — one-time CSV download link.

Guards before every send: recipient not in `stop_emails`, per-recipient daily
cap in `rate_limits`. Every email footer carries a "stop emailing me" link
that adds the address hash to `stop_emails` (no login needed).

---

## 8. Frontend details

### Zustand stores

```ts
// src/stores/manage-links.ts — persisted to localStorage
export const useManageLinks = create(persist((set) => ({
  links: {} as Record<string, string>,          // memoryId → manageSecret
  save: (id, secret) => set(s => ({ links: { ...s.links, [id]: secret } })),
  remove: (id) => set(s => { const l = { ...s.links }; delete l[id];
                             return { links: l }; }),
}), { name: "wb-manage-links" }));
```

`/my-entries` reads this store to list everything the visitor can manage —
this is how an account-less app still shows "your" entries. The draft store
autosaves the add-form so an accidental refresh loses nothing.

### Framer Motion
- `sentence-preview.tsx` — `AnimatePresence` re-animates the sentence on each
  field change (the plan's signature interaction).
- `memory-card` — `layout` + stagger fade on list/filter changes.
- Sidebar → mobile `Sheet` transition.
- Respect `prefers-reduced-motion` via `MotionConfig reducedMotion="user"`.

### shadcn/ui components
`Card` for entries, `Badge` for Confirmed (`--confirmed` green) / Not yet
confirmed (muted), `Tabs` for the someone-helped-me / i-helped-someone toggle,
`Sheet` for the mobile sidebar, `Dialog` for report + delete confirms,
`Sonner` for action toasts, `Skeleton` for list loading, `Table` on the admin
page, `lucide-react` icons throughout (`Heart`, `Search`, `PlusCircle`,
`ShieldCheck`, `Flag`, `Download`, `Trash2`, `Menu`, …).

### Accessibility (WCAG 2.2 AA target from the plan)
- shadcn primitives give focus management/aria for free; audit contrast of
  gold `#d4a62a` on white (use it for accents, not body text).
- Server-rendered, light pages — works on basic phones.
- Visible focus rings, labelled inputs (`<Label htmlFor>`), `aria-live` on the
  sentence preview.

---

## 9. SEO / indexing rules

Per the plan: browsable but **not indexed**.

```ts
// src/app/robots.ts
export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/add", "/privacy"],
      disallow: ["/memories", "/named", "/manage", "/my-entries", "/admin"],
    },
  };
}
```

Plus `export const metadata = { robots: { index: false } }` on the detail,
named, manage, my-entries and admin pages.

---

## 10. PWA (installable)

- `app/manifest.ts` — name "Workbrook Memory", brand-blue `theme_color`
  `#3b6fd8`, `display: "standalone"`, maskable icons (192/512).
- Serwist service worker (`@serwist/next`): precache the shell, cache-first
  for static assets, network-first for pages. Offline = cached shell + an
  offline notice (no offline writes — keeps consent flows truthful).
- `sw.ts` + `next.config.ts` wrapper per Serwist docs.

---

## 11. Vercel + Neon setup

1. Push repo to GitHub → **Import Project** in Vercel.
2. Vercel → **Storage → Marketplace → Neon** → create database. It injects:
   `DATABASE_URL` (pooled), plus `POSTGRES_URL*` variants.
3. `drizzle.config.ts`:

```ts
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

4. `src/db/client.ts` uses `neon(process.env.DATABASE_URL!)` + `drizzle()`.
5. Migrations: `drizzle-kit generate` → commit `drizzle/` → run
   `drizzle-kit migrate` as a Vercel build step (`vercel-build` script) or in
   CI before deploy.
6. **Preview branches**: Neon's Vercel integration creates a DB branch per
   preview deployment — each PR gets an isolated database.
7. Env vars (Vercel dashboard):
   `DATABASE_URL`, `RESEND_API_KEY`, `EMAIL_FROM`,
   `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`,
   `ADMIN_KEY`, `APP_URL`, `OWNER_EMAIL` (report recipient).

---

## 12. Rate limits & abuse controls (from the plan)

| Guard | Limit |
|---|---|
| Add memory | 10 / day / IP, 5 / day / author email |
| Report | 5 / day / IP |
| Emails to one address | 3 / day |
| Manage-link recovery | 3 / hour / IP |
| Turnstile | On every public mutation |
| Text fields | Hard length caps; strip `http(s)://` and `www.` |
| Secrets | nanoid(32), sha256 at rest, single use where noted |

`rate-limit.ts` implements a fixed-window upsert on the `rate_limits` table —
atomic `INSERT … ON CONFLICT DO UPDATE count + 1 RETURNING count`, reject when
over the cap. Swap for Upstash later if needed.

---

## 13. Tests (the plan's required cases)

Vitest unit/API tests — all from the plan's checklist:

- **Links work once then expire** — consuming a token twice fails; expired
  tokens fail.
- **Reports hide entries** — after `submitReport`, entry disappears from
  `/memories` queries and its API serialization.
- **Rate limits trigger** — N+1 th request rejected.
- **Surnames never appear in the API** — snapshot/grep test on
  `toPublicMemory` output and every public route's payload (also assert no
  `email` keys).
- Date validation rejects future years; URL-stripping works; `stop_emails`
  suppresses sends (mock Resend).

Playwright smoke: add → consent link → confirm → appears in list as
Confirmed; report → hidden. Run against a Neon preview branch.

---

## 14. Build order (matches the plan)

1. **Data and rules** — schema, migrations, `toPublicMemory`, rate limits.
2. **Add a memory** — form, sentence preview, private manage link.
3. **Public pages** — list, search, filters, detail. *(Public only after
   consent flow exists — flip on in step 4.)*
4. **Consent and email** — Resend templates, `/named/[token]`, report.
5. **Manage and export** — `/my-entries`, `/manage/[token]`, CSV.
6. **Harden and launch** — Turnstile everywhere, accessibility pass, tests,
   staging on a Vercel preview + Neon branch.

---

## 15. Launch checklist (from the plan)

- [ ] Proof no contact detail leaks (API payload tests + manual review)
- [ ] A named person removes an entry instantly (one click, no login)
- [ ] One real backup restore rehearsed (Neon point-in-time restore)
- [ ] Privacy page and report process live
- [ ] `noindex` verified on memory pages
- [ ] Turnstile + rate limits verified on staging
- [ ] Repo transferred to client with README; all credentials handed over

## 16. Open decisions (block nothing — defaults logged)

- Memory wall: public vs link-only → default **public, noindex**.
- Report reviewer + SLA → default **owner email + admin page**.
- Wording for artisan/referral work → default neutral sentence.
- Retention/deletion/legal responsibility for third-party data → **client
  must answer** before launch.
