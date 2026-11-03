import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { rateLimits } from "@/db/schema";

function today() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

/**
 * Fixed-window counter backed by the rate_limits table. Returns true when the
 * call is allowed; the window is embedded in the key so counters self-expire.
 */
export async function allow(scope: string, key: string, max: number) {
  const db = getDb();
  const fullKey = `${scope}:${key}:${today()}`;
  const [row] = await db
    .insert(rateLimits)
    .values({ key: fullKey, count: 1 })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: { count: sql`${rateLimits.count} + 1` },
    })
    .returning({ count: rateLimits.count });
  return row.count <= max;
}
