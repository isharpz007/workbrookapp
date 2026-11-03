"use server";

import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { getDb } from "@/db/client";
import { memories } from "@/db/schema";
import { memoryInputSchema } from "@/lib/validation";
import { sha256 } from "@/lib/hash";
import { buildSentence } from "@/lib/sentence";
import { RATE_LIMITS, TOKEN_TTL } from "@/lib/constants";
import { verifyTurnstile } from "@/server/turnstile";
import { allow } from "@/server/rate-limit";
import { mintToken } from "@/server/tokens";
import { sendConsentEmail } from "@/server/email";

export type CreateMemoryResult =
  | { ok: true; id: string; manageSecret: string }
  | { ok: false; error: string };

export async function createMemory(input: unknown): Promise<CreateMemoryResult> {
  // 1. Validate before touching the database.
  const parsed = memoryInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Check the form and try again.",
    };
  }
  const data = parsed.data;

  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  // 2. Bot check — skipped when Turnstile isn't configured (local dev).
  if (!(await verifyTurnstile(data.turnstileToken, ip))) {
    return { ok: false, error: "Human check failed. Please try again." };
  }

  try {
    // 3. Rate limit.
    if (!(await allow("add", ip, RATE_LIMITS.addPerIpPerDay))) {
      return {
        ok: false,
        error: "You've added a lot today. Please come back tomorrow.",
      };
    }

    // 4. Store. The raw manage secret only ever lives in the author's link.
    const manageSecret = nanoid(32);
    const status =
      data.visibility === "public" ? "pending_consent" : "private";

    const [memory] = await getDb()
      .insert(memories)
      .values({
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
        manageSecretHash: sha256(manageSecret),
      })
      .returning({ id: memories.id });

    // 5. Consent outreach when the entry is shared and we have an address.
    if (status === "pending_consent" && data.personEmail) {
      const token = await mintToken(
        memory.id,
        "consent",
        TOKEN_TTL.consentMs
      );
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

    return { ok: true, id: memory.id, manageSecret };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error && e.message.includes("DATABASE_URL")
          ? e.message
          : "Something went wrong saving your memory. Please try again.",
    };
  }
}
