import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db/client", () => ({ getDb: vi.fn() }));

import { getDb } from "@/db/client";
import { allow } from "./rate-limit";

const getDbMock = vi.mocked(getDb);

function mockCount(count: number) {
  getDbMock.mockReturnValue({
    insert: () => ({
      values: () => ({
        onConflictDoUpdate: () => ({
          returning: () => Promise.resolve([{ count }]),
        }),
      }),
    }),
  } as never);
}

beforeEach(() => vi.clearAllMocks());

describe("allow — fixed-window rate limits", () => {
  it("permits calls up to the cap", async () => {
    mockCount(3);
    expect(await allow("add", "1.2.3.4", 3)).toBe(true);
  });

  it("triggers once the cap is exceeded", async () => {
    mockCount(4);
    expect(await allow("add", "1.2.3.4", 3)).toBe(false);
  });
});
