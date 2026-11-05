import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { memories } from "@/db/schema";
import { memoriesToCsv } from "@/lib/csv";
import { consumeToken } from "@/server/tokens";
import { logError } from "@/server/logger";

/**
 * One-time CSV download — the link is minted by requestExportLink and
 * emailed to the entry's author. Works once, expires in 15 minutes.
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  try {
    const t = await consumeToken(token, "export");
    if (!t?.memoryId) {
      return new Response("This link has expired or was already used.", {
        status: 410,
      });
    }

    const db = getDb();
    const [m] = await db
      .select()
      .from(memories)
      .where(eq(memories.id, t.memoryId))
      .limit(1);
    if (!m) return new Response("Not found.", { status: 404 });

    const rows = m.authorEmail
      ? await db
          .select()
          .from(memories)
          .where(eq(memories.authorEmail, m.authorEmail))
          .orderBy(desc(memories.createdAt))
      : [m];

    return new Response(memoriesToCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="workbrook-my-entries.csv"',
      },
    });
  } catch (err) {
    logError(err, { action: "exportCsvRoute" });
    return new Response("Something went wrong.", { status: 500 });
  }
}
