import type { Memory } from "@/db/schema";
import { displayName } from "./sentence";

export type PublicMemory = ReturnType<typeof toPublicMemory>;

/**
 * The ONLY way memory data reaches the client. authorEmail, personEmail and
 * manageSecretHash are never returned; unconfirmed names are initials only.
 */
export function toPublicMemory(m: Memory) {
  const confirmed = m.status === "confirmed";
  const name = displayName(m.personFirstName, m.personLastInitial, confirmed);
  const place = m.personCity ? ` from ${m.personCity}` : "";

  const sentence =
    m.direction === "someone_helped_me"
      ? name
        ? `${name}${place} helped me find work.`
        : "Someone helped me find work."
      : name
        ? `I helped ${name}${place} find work.`
        : "I helped someone find work.";

  return {
    id: m.id,
    personName: name,
    sentence,
    jobTitle: m.jobTitle,
    year: m.year,
    city: m.personCity,
    region: m.personRegion,
    status: confirmed ? ("confirmed" as const) : ("not_yet_confirmed" as const),
    createdAt: m.createdAt.toISOString(),
  };
}
