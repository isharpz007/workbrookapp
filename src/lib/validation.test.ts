import { describe, expect, it } from "vitest";
import { MAX_YEAR, MIN_YEAR } from "./constants";
import { memoryInputSchema } from "./validation";

const minimal = { direction: "someone_helped_me", year: 2019 };

describe("memoryInputSchema", () => {
  it("accepts an entry with only the year — per the plan", () => {
    const res = memoryInputSchema.safeParse(minimal);
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.visibility).toBe("only_me");
  });

  it("requires the year", () => {
    expect(
      memoryInputSchema.safeParse({ direction: "someone_helped_me" }).success
    ).toBe(false);
  });

  it("rejects future and impossible dates", () => {
    for (const year of [MAX_YEAR + 1, MIN_YEAR - 1, 1800, 3000]) {
      expect(memoryInputSchema.safeParse({ ...minimal, year }).success).toBe(
        false
      );
    }
  });

  it("strips links from free-text fields", () => {
    for (const jobTitle of [
      "see https://spam.example",
      "visit www.spam.example",
      "check http://x",
    ]) {
      expect(
        memoryInputSchema.safeParse({ ...minimal, jobTitle }).success
      ).toBe(false);
    }
  });

  it("keeps only the first letter, uppercased, as last initial", () => {
    const res = memoryInputSchema.safeParse({
      ...minimal,
      personLastInitial: "ob",
    });
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.personLastInitial).toBe("O");
  });
});
