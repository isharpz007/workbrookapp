import { nanoid } from "nanoid";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { actionTokens, type ActionToken } from "@/db/schema";
import { sha256 } from "@/lib/hash";

export type TokenPurpose = "consent" | "recover" | "export";

/** Mint a one-time token. Returns the RAW token — only the hash is stored. */
export async function mintToken(
  memoryId: string,
  purpose: TokenPurpose,
  ttlMs: number
): Promise<string> {
  const raw = nanoid(32);
  await getDb().insert(actionTokens).values({
    memoryId,
    purpose,
    tokenHash: sha256(raw),
    expiresAt: new Date(Date.now() + ttlMs),
  });
  return raw;
}

/** Consume a one-time token. Returns the row, or null if invalid/expired/used. */
export async function consumeToken(
  raw: string,
  purpose: TokenPurpose
): Promise<ActionToken | null> {
  const db = getDb();
  const rows = await db
    .update(actionTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(actionTokens.tokenHash, sha256(raw)),
        eq(actionTokens.purpose, purpose),
        isNull(actionTokens.usedAt),
        gt(actionTokens.expiresAt, new Date())
      )
    )
    .returning();
  return rows[0] ?? null;
}
