"use server";

import { and, desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb } from "@/db/client";
import { memories, reports } from "@/db/schema";
import { reportInputSchema } from "@/lib/validation";
import { buildSentence } from "@/lib/sentence";
import { RATE_LIMITS } from "@/lib/constants";
import { verifyTurnstile } from "@/server/turnstile";
import { allow } from "@/server/rate-limit";
import { sendReportNotice } from "@/server/email";
import { action, fail } from "@/server/errors";

const REASON_LABELS: Record<string, string> = {
  about_me: "This entry is about me",
  false_info: "False information",
  abuse: "Harassment or abuse",
  other: "Other",
};

export const submitReport = action(
  "submitReport",
  async (input: unknown) => {
    const parsed = reportInputSchema.safeParse(input);
    if (!parsed.success) fail("VALIDATION", "Please choose a reason.");
    const data = parsed.data;

    const ip =
      (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";

    if (!(await verifyTurnstile(data.turnstileToken, ip))) {
      fail("HUMAN_CHECK");
    }
    if (!(await allow("report", ip, RATE_LIMITS.reportPerIpPerDay))) {
      fail("RATE_LIMITED", "Too many reports today.");
    }

    const db = getDb();
    const [m] = await db
      .select()
      .from(memories)
      .where(eq(memories.id, data.memoryId))
      .limit(1);
    if (!m) fail("NOT_FOUND");

    // Hide immediately — per the plan — then notify the owner.
    await db.insert(reports).values({
      memoryId: m.id,
      reason: data.reason,
      details: data.details,
    });
    await db
      .update(memories)
      .set({ status: "hidden", updatedAt: new Date() })
      .where(eq(memories.id, m.id));

    await sendReportNotice({
      memoryId: m.id,
      sentence: buildSentence(m),
      reason: REASON_LABELS[data.reason] ?? data.reason,
    });

    return { ok: true as const };
  }
);

function requireAdmin(key: string) {
  const expected = process.env.ADMIN_KEY;
  if (!expected || key !== expected) fail("FORBIDDEN");
}

export async function listReports(key: string) {
  requireAdmin(key); // throws — the admin page renders the unauthorized card
  const db = getDb();
  const rows = await db
    .select({ report: reports, memory: memories })
    .from(reports)
    .innerJoin(memories, eq(reports.memoryId, memories.id))
    .where(eq(reports.status, "open"))
    .orderBy(desc(reports.createdAt))
    .limit(100);

  return rows.map(({ report, memory }) => ({
    reportId: report.id,
    memoryId: memory.id,
    reason: REASON_LABELS[report.reason] ?? report.reason,
    details: report.details,
    reportedAt: report.createdAt.toISOString(),
    sentence: buildSentence(memory),
    memoryStatus: memory.status,
  }));
}

export const resolveReport = action(
  "resolveReport",
  async (key: string, reportId: string, act: "restore" | "remove") => {
    requireAdmin(key);
    const db = getDb();
    const [r] = await db
      .select()
      .from(reports)
      .where(eq(reports.id, reportId))
      .limit(1);
    if (!r) fail("NOT_FOUND");

    await db
      .update(reports)
      .set({ status: "resolved" })
      .where(eq(reports.id, r.id));
    await db
      .update(memories)
      .set({
        status: act === "restore" ? "pending_consent" : "removed",
        updatedAt: new Date(),
      })
      .where(and(eq(memories.id, r.memoryId), eq(memories.status, "hidden")));

    return { ok: true as const };
  }
);
