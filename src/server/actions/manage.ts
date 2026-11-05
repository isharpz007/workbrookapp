"use server";

import { and, desc, eq, gt, inArray, isNull, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb } from "@/db/client";
import { actionTokens, memories, type Memory } from "@/db/schema";
import { memoryInputSchema, recoverInputSchema } from "@/lib/validation";
import { sha256 } from "@/lib/hash";
import { buildSentence } from "@/lib/sentence";
import { TOKEN_TTL } from "@/lib/constants";
import { consumeToken, mintToken } from "@/server/tokens";
import { sendConsentEmail, sendRecoveryEmail } from "@/server/email";
import { allow } from "@/server/rate-limit";
import { verifyTurnstile } from "@/server/turnstile";
import { action, fail } from "@/server/errors";
import { logError } from "@/server/logger";

const APP_URL = () => process.env.APP_URL ?? "http://localhost:3000";

/**
 * A "credential" is either the raw manage secret (hash on the row) or a
 * valid one-time `recover` token from the recovery email. Mutations consume
 * recover tokens; viewing only peeks at them.
 */
async function resolveCredential(
  credential: string,
  consume: boolean
): Promise<Memory | null> {
  const db = getDb();

  const [bySecret] = await db
    .select()
    .from(memories)
    .where(eq(memories.manageSecretHash, sha256(credential)))
    .limit(1);
  if (bySecret) return bySecret;

  if (consume) {
    const t = await consumeToken(credential, "recover");
    if (!t?.memoryId) return null;
    const [m] = await db
      .select()
      .from(memories)
      .where(eq(memories.id, t.memoryId))
      .limit(1);
    return m ?? null;
  }

  const [t] = await db
    .select()
    .from(actionTokens)
    .where(
      and(
        eq(actionTokens.tokenHash, sha256(credential)),
        eq(actionTokens.purpose, "recover"),
        isNull(actionTokens.usedAt),
        gt(actionTokens.expiresAt, new Date())
      )
    )
    .limit(1);
  if (!t?.memoryId) return null;
  const [m] = await db
    .select()
    .from(memories)
    .where(eq(memories.id, t.memoryId))
    .limit(1);
  return m ?? null;
}

/** /my-entries — resolve the visitor's locally-stored secrets to entries. */
export const getMyEntries = action(
  "getMyEntries",
  async (secrets: string[]) => {
    const db = getDb();
    const hashes = secrets.map(sha256);
    const rows = await db
      .select()
      .from(memories)
      .where(inArray(memories.manageSecretHash, hashes))
      .orderBy(desc(memories.createdAt))
      .limit(50);

    const byHash = new Map(rows.map((r) => [r.manageSecretHash, r]));
    return secrets
      .map((secret) => {
        const m = byHash.get(sha256(secret));
        if (!m) return null;
        const meta = [m.jobTitle, m.year, m.personRegion ?? m.personCity]
          .filter(Boolean)
          .join(" · ");
        return {
          secret,
          id: m.id,
          sentence: buildSentence(m),
          meta,
          status: m.status,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }
);

/** /manage/[token] — accepts a manage secret or a recovery token. */
export async function getManageEntry(credential: string) {
  try {
    const m = await resolveCredential(credential, false);
    if (!m) return null;
    return {
      id: m.id,
      direction: m.direction,
      year: m.year,
      jobTitle: m.jobTitle ?? "",
      personFirstName: m.personFirstName ?? "",
      personLastInitial: m.personLastInitial ?? "",
      personCity: m.personCity ?? "",
      personRegion: m.personRegion ?? "",
      personEmail: m.personEmail ?? "",
      authorEmail: m.authorEmail ?? "",
      visibility:
        m.status === "private" ? ("only_me" as const) : ("public" as const),
      status: m.status,
      thanksCount: m.thanksCount,
    };
  } catch (err) {
    logError(err, { action: "getManageEntry" });
    return null;
  }
}

export const updateMemory = action(
  "updateMemory",
  async (credential: string, input: unknown) => {
    const parsed = memoryInputSchema.safeParse(input);
    if (!parsed.success) {
      fail(
        "VALIDATION",
        parsed.error.issues[0]?.message ?? "Please check your entries."
      );
    }
    const data = parsed.data;

    const db = getDb();
    const m = await resolveCredential(credential, true);
    if (!m) fail("LINK_EXPIRED");

    // Editing a confirmed entry resets it to pending and re-sends consent.
    const wasConfirmed = m.status === "confirmed";
    const status =
      data.visibility === "public" ? "pending_consent" : "private";

    await db
      .update(memories)
      .set({
        direction: data.direction,
        year: data.year,
        jobTitle: data.jobTitle,
        personFirstName: data.personFirstName,
        personLastInitial: data.personLastInitial,
        personCity: data.personCity,
        personRegion: data.personRegion,
        authorEmail: data.authorEmail,
        personEmail: data.visibility === "public" ? data.personEmail : null,
        status,
        confirmedAt: status === "pending_consent" ? null : m.confirmedAt,
        updatedAt: new Date(),
      })
      .where(eq(memories.id, m.id));

    if (wasConfirmed && status === "pending_consent" && data.personEmail) {
      const token = await mintToken(m.id, "consent", TOKEN_TTL.consentMs);
      await sendConsentEmail({
        to: data.personEmail,
        sentence: buildSentence({
          direction: data.direction,
          personFirstName: data.personFirstName ?? null,
          personLastInitial: data.personLastInitial ?? null,
          personCity: data.personCity ?? null,
        }),
        token,
      });
    }

    return { ok: true as const };
  }
);

export const deleteMemory = action(
  "deleteMemory",
  async (credential: string) => {
    const db = getDb();
    const m = await resolveCredential(credential, true);
    if (!m) fail("LINK_EXPIRED");
    await db.delete(memories).where(eq(memories.id, m.id));
    return { ok: true as const };
  }
);

const csvEsc = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV of your own entries — every entry that shares your author email. */
export const exportCsv = action("exportCsv", async (credential: string) => {
  const db = getDb();
  const m = await resolveCredential(credential, true);
  if (!m) fail("LINK_EXPIRED");

  const rows = m.authorEmail
    ? await db
        .select()
        .from(memories)
        .where(eq(memories.authorEmail, m.authorEmail))
        .orderBy(desc(memories.createdAt))
    : [m];

  const header =
    "id,direction,first_name,last_initial,city,region,job,year,status,thanks,created_at";
  const body = rows
    .map((r) =>
      [
        r.id,
        r.direction,
        r.personFirstName,
        r.personLastInitial,
        r.personCity,
        r.personRegion,
        r.jobTitle,
        r.year,
        r.status,
        r.thanksCount,
        r.createdAt.toISOString(),
      ]
        .map(csvEsc)
        .join(",")
    )
    .join("\n");

  return {
    ok: true as const,
    csv: `${header}\n${body}\n`,
    filename: "workbrook-my-entries.csv",
  };
});

/**
 * Manage-link recovery — always returns the same response so it can't be
 * used to probe which emails exist.
 */
export const requestManageLink = action(
  "requestManageLink",
  async (input: unknown) => {
    const GENERIC = {
      ok: true as const,
      message: "If that email is on an entry, we've sent your links.",
    };

    const parsed = recoverInputSchema.safeParse(input);
    if (!parsed.success) return GENERIC;

    const ip =
      (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    if (!(await verifyTurnstile(parsed.data.turnstileToken, ip))) {
      fail("HUMAN_CHECK");
    }

    if (!(await allow("recover", ip, 3))) return GENERIC;

    const db = getDb();
    const rows = await db
      .select()
      .from(memories)
      .where(eq(memories.authorEmail, parsed.data.email))
      .limit(20);
    if (rows.length === 0) return GENERIC;

    const links = await Promise.all(
      rows.map(async (m) => ({
        sentence: buildSentence(m),
        url: `${APP_URL()}/manage/${await mintToken(m.id, "recover", TOKEN_TTL.recoverMs)}`,
      }))
    );
    await sendRecoveryEmail({ to: parsed.data.email, links });
    return GENERIC;
  }
);

export const sayThanks = action("sayThanks", async (memoryId: string) => {
  const [row] = await getDb()
    .update(memories)
    .set({ thanksCount: sql`${memories.thanksCount} + 1` })
    .where(
      and(
        eq(memories.id, memoryId),
        inArray(memories.status, ["pending_consent", "confirmed"])
      )
    )
    .returning({ thanksCount: memories.thanksCount });
  return row
    ? { ok: true as const, count: row.thanksCount }
    : { ok: false as const };
});
