import type { Memory } from "@/db/schema";

type Person = Pick<
  Memory,
  "direction" | "personFirstName" | "personLastInitial" | "personCity"
>;

/**
 * The single neutral sentence from the plan, e.g.
 *   "Ada O. from Lagos helped me find work."
 *   "I helped Chinedu O. from Abuja find work."
 * Only the year is required, so every other field degrades gracefully.
 */
export function buildSentence(p: Person): string {
  const name = [p.personFirstName, p.personLastInitial]
    .filter(Boolean)
    .join(" ");
  const named = name ? `${name}.` : null;
  const place = p.personCity ? ` from ${p.personCity}` : "";

  if (p.direction === "someone_helped_me") {
    return named
      ? `${named}${place} helped me find work.`
      : "Someone helped me find work.";
  }
  return named
    ? `I helped ${named}${place} find work.`
    : "I helped someone find work.";
}

/** The fixed "Name X." label used on cards, e.g. "Ada O." or "A. O." */
export function displayName(
  firstName: string | null,
  lastInitial: string | null,
  confirmed: boolean
): string | null {
  if (!firstName) return null;
  if (confirmed) {
    return `${firstName}${lastInitial ? ` ${lastInitial}.` : ""}`;
  }
  // Unconfirmed → initials only, e.g. "A. O."
  return `${firstName.charAt(0).toUpperCase()}.${
    lastInitial ? ` ${lastInitial}.` : ""
  }`;
}
