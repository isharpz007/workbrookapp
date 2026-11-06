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
import { action, fail } from "@/server/errors";

export type CreateMemoryResult =
  | { ok: true; id: string; manageSecret: string }
  | { ok: false; error: string };

export const createMemory = action(
  "createMemory",
  async (input: unknown): Promise<CreateMemoryResult> => {
    const parsed = memoryInputSchema.safeParse(input);
    if (!parsed.success) {
      fail(
        "VALIDATION",
        parsed.error.issues[0]?.message ?? "Please check your entries."
      );
    }
    const data = parsed.data;

    const ip =
      (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";

    if (!(await verifyTurnstile(data.turnstileToken, ip))) {
      fail("HUMAN_CHECK");
    }

    if (!(await allow("add", ip, RATE_LIMITS.addPerIpPerDay))) {
      fail("RATE_LIMITED", "You've added a lot today. Please come back tomorrow.");
    }

    const manageSecret = nanoid(32);
    const status =
      data.visibility === "public" ? "pending_consent" : "private";

    const [memory] = await getDb()
      .insert(memories)
      .values({
        direction: data.direction,
        year: data.year,
        month: data.month,
        day: data.day,
        jobTitle: data.jobTitle,
        company: data.company,
        workLocation: data.workLocation,
        personFirstName: data.personFirstName,
        personLastInitial: data.personLastInitial,
        personCity: data.personCity,
        personRegion: data.personRegion,
        authorEmail: data.authorEmail,
        personEmail: data.visibility === "public" ? data.personEmail : null,
        personPhone: data.visibility === "public" ? data.personPhone : null,
        thankYouMessage: data.thankYouMessage,
        status,
        manageSecretHash: sha256(manageSecret),
      })
      .returning({ id: memories.id });

    if (status === "pending_consent" && data.personEmail) {
      const token = await mintToken(memory.id, "consent", TOKEN_TTL.consentMs);
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
  }
);
