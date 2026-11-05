import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { getDb } from "@/db/client";
import { memories } from "@/db/schema";
import { toPublicMemory, type PublicMemory } from "@/lib/public-memory";

/** Only these statuses are ever visible on the public wall. */
const PUBLIC_STATUSES = ["pending_consent", "confirmed"] as const;

function escapeLike(s: string) {
  return s.replace(/[%_\\]/g, (c) => `\\${c}`);
}

export async function listPublicMemories(opts: {
  q?: string;
  status?: "confirmed" | "not_yet_confirmed";
  limit?: number;
}): Promise<PublicMemory[]> {
  const conds = [];

  if (opts.status === "confirmed") {
    conds.push(eq(memories.status, "confirmed"));
  } else if (opts.status === "not_yet_confirmed") {
    conds.push(eq(memories.status, "pending_consent"));
  } else {
    conds.push(inArray(memories.status, [...PUBLIC_STATUSES]));
  }

  const q = opts.q?.trim();
  if (q) {
    const like = `%${escapeLike(q)}%`;
    const fields = [
      ilike(memories.personFirstName, like),
      ilike(memories.jobTitle, like),
      ilike(memories.personCity, like),
      ilike(memories.personRegion, like),
    ];
    const year = Number.parseInt(q, 10);
    const match = Number.isInteger(year)
      ? or(...fields, eq(memories.year, year))
      : or(...fields);
    if (match) conds.push(match);
  }

  const rows = await getDb()
    .select()
    .from(memories)
    .where(and(...conds))
    .orderBy(desc(memories.createdAt))
    .limit(opts.limit ?? 60);

  return rows.map(toPublicMemory);
}

export async function getPublicMemory(
  id: string
): Promise<PublicMemory | null> {
  const [row] = await getDb()
    .select()
    .from(memories)
    .where(
      and(eq(memories.id, id), inArray(memories.status, [...PUBLIC_STATUSES]))
    )
    .limit(1);
  return row ? toPublicMemory(row) : null;
}
