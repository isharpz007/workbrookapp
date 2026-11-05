import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db/client", () => ({ getDb: vi.fn() }));

import { getDb } from "@/db/client";
import { sha256 } from "@/lib/hash";
import { consumeToken, mintToken } from "./tokens";

const getDbMock = vi.mocked(getDb);

beforeEach(() => vi.clearAllMocks());

describe("mintToken", () => {
  it("stores only the hash — the raw value never touches the db", async () => {
    const values = vi.fn().mockResolvedValue(undefined);
    getDbMock.mockReturnValue({
      insert: () => ({ values }),
    } as never);

    const raw = await mintToken("mem-1", "consent", 60_000);

    expect(raw).toHaveLength(32);
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        memoryId: "mem-1",
        purpose: "consent",
        tokenHash: sha256(raw),
        expiresAt: expect.any(Date),
      })
    );
    expect(values.mock.calls[0][0].tokenHash).not.toBe(raw);
  });
});

describe("consumeToken — links work once then expire", () => {
  it("returns the row once, then null once used or expired", async () => {
    const row = { id: "tok-1", memoryId: "mem-1" };
    // First call matches a live token; second finds nothing (used/expired).
    const returning = vi
      .fn()
      .mockResolvedValueOnce([row])
      .mockResolvedValue([]);
    const set = vi.fn(() => ({ where: () => ({ returning }) }));
    getDbMock.mockReturnValue({
      update: () => ({ set }),
    } as never);

    expect(await consumeToken("raw-token", "consent")).toEqual(row);
    expect(await consumeToken("raw-token", "consent")).toBeNull();

    // Consumption marks the token used in the same update.
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({ usedAt: expect.any(Date) })
    );
  });
});
