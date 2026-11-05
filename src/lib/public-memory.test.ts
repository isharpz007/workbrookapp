import { describe, expect, it } from "vitest";
import type { Memory } from "@/db/schema";
import { toPublicMemory } from "./public-memory";

const base: Memory = {
  id: "m-1",
  direction: "someone_helped_me",
  personFirstName: "Ada",
  personLastInitial: "O",
  personCity: "Lagos",
  personRegion: null,
  jobTitle: "Electrician",
  year: 2019,
  status: "pending_consent",
  authorEmail: "author@example.com",
  personEmail: "ada.surname@example.com",
  thanksCount: 0,
  manageSecretHash: "deadbeefsecret",
  confirmedAt: null,
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-01-01T00:00:00Z"),
};

describe("toPublicMemory — the privacy boundary", () => {
  it("shows initials only while unconfirmed", () => {
    const pub = toPublicMemory(base);
    expect(pub.personName).toBe("A. O.");
    expect(pub.sentence).toBe("A. O. from Lagos helped me find work.");
    expect(pub.status).toBe("not_yet_confirmed");
  });

  it("shows first name + initial once confirmed", () => {
    const pub = toPublicMemory({ ...base, status: "confirmed" });
    expect(pub.personName).toBe("Ada O.");
    expect(pub.status).toBe("confirmed");
  });

  it("uses the helped-someone phrasing for i_helped_someone", () => {
    const pub = toPublicMemory({
      ...base,
      direction: "i_helped_someone",
      status: "confirmed",
      personFirstName: "Chinedu",
    });
    expect(pub.sentence).toBe("I helped Chinedu O. from Lagos find work.");
  });

  it("never leaks contact details, secrets or surnames", () => {
    for (const status of ["pending_consent", "confirmed", "private"]) {
      const out = JSON.stringify(toPublicMemory({ ...base, status: status as Memory["status"] }));
      expect(out).not.toContain("@example.com");
      expect(out).not.toContain("surname");
      expect(out).not.toContain("deadbeef");
      expect(out).not.toContain("Email");
      expect(out).not.toContain("Secret");
    }
  });
});
