import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db/client", () => ({ getDb: vi.fn() }));
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));
vi.mock("@/server/turnstile", () => ({
  verifyTurnstile: vi.fn().mockResolvedValue(true),
}));
vi.mock("@/server/rate-limit", () => ({
  allow: vi.fn().mockResolvedValue(true),
}));
vi.mock("@/server/email", () => ({
  sendReportNotice: vi.fn().mockResolvedValue({ sent: true }),
}));
vi.mock("@/server/logger", () => ({
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

import { getDb } from "@/db/client";
import type { Memory } from "@/db/schema";
import { PUBLIC_STATUSES } from "@/server/queries";
import { submitReport } from "./reports";

const getDbMock = vi.mocked(getDb);

const memory: Memory = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  direction: "someone_helped_me",
  personFirstName: "Ada",
  personLastInitial: "O",
  personCity: "Lagos",
  personRegion: null,
  jobTitle: "Electrician",
  year: 2019,
  status: "confirmed",
  authorEmail: null,
  personEmail: null,
  thanksCount: 0,
  manageSecretHash: "deadbeef",
  confirmedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => vi.clearAllMocks());

describe("submitReport — reports hide entries", () => {
  it("hides the memory immediately and notifies the owner", async () => {
    const setArgs: Record<string, unknown>[] = [];
    getDbMock.mockReturnValue({
      select: () => ({
        from: () => ({
          where: () => ({ limit: () => Promise.resolve([memory]) }),
        }),
      }),
      insert: () => ({ values: () => Promise.resolve([]) }),
      update: () => ({
        set: (v: Record<string, unknown>) => {
          setArgs.push(v);
          return { where: () => Promise.resolve([]) };
        },
      }),
    } as never);

    const res = await submitReport({
      memoryId: memory.id,
      reason: "about_me",
      turnstileToken: "token",
    });

    expect(res.ok).toBe(true);
    expect(setArgs).toContainEqual(
      expect.objectContaining({ status: "hidden" })
    );
  });

  it("hidden is not a public status — hidden entries leave the wall", () => {
    expect(PUBLIC_STATUSES).not.toContain("hidden");
    expect(PUBLIC_STATUSES).not.toContain("removed");
    expect(PUBLIC_STATUSES).not.toContain("private");
  });
});
