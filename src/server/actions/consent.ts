"use server";

import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { actionTokens, memories, stopEmails } from "@/db/schema";
import { sha256, hashEmail } from "@/lib/hash";
import { buildSentence } from "@/lib/sentence";
import { consumeToken } from "@/server/tokens";
import { action, fail } from "@/server/errors";

export type ConsentAction = "confirm" | "keep_private" | "remove";

/** Peek at a consent token WITHOUT consuming it — the page can be reloaded. */
export const getConsentInfo = action(
  "getConsentInfo",
  async (token: string) => {
    const db = getDb();
    const [t] = await db
      .select()
      .from(actionTokens)
      .where(
        and(
          eq(actionTokens.tokenHash, sha256(token)),
          eq(actionTokens.purpose, "consent"),
          isNull(actionTokens.usedAt),
          gt(actionTokens.expiresAt, new Date())
        )
      )
      .limit(1);
    if (!t?.memoryId) return { ok: false as const };

    const [m] = await db
      .select()
      .from(memories)
      .where(eq(memories.id, t.memoryId))
      .limit(1);
    if (!m || m.status === "removed") return { ok: false as const };

    const meta = [m.jobTitle, m.year, m.personRegion ?? m.personCity]
      .filter(Boolean)
      .join(" · ");
    return { ok: true as const, sentence: buildSentence(m), meta };
  }
);

/** Consume the token and apply the named person's choice. */
export const respondConsent = action(
  "respondConsent",
  async (token: string, consentAction: ConsentAction) => {
    const db = getDb();
    const t = await consumeToken(token, "consent");
    if (!t?.memoryId) fail("LINK_EXPIRED");

    const [m] = await db
      .select()
      .from(memories)
      .where(eq(memories.id, t.memoryId))
      .limit(1);
    if (!m) fail("NOT_FOUND");

    if (consentAction === "confirm") {
      await db
        .update(memories)
        .set({
          status: "confirmed",
          confirmedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(memories.id, m.id));
    } else if (consentAction === "keep_private") {
      await db
        .update(memories)
        .set({ status: "private", updatedAt: new Date() })
        .where(eq(memories.id, m.id));
    } else {
      await db
        .update(memories)
        .set({ status: "removed", updatedAt: new Date() })
        .where(eq(memories.id, m.id));
      if (m.personEmail) {
        await db
          .insert(stopEmails)
          .values({ emailHash: hashEmail(m.personEmail) })
          .onConflictDoNothing();
      }
    }

    return { ok: true as const, action: consentAction };
  }
);
