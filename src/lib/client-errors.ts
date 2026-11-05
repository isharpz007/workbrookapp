"use client";

import { ERROR_MESSAGES, type ActionError } from "./error-codes";

/**
 * Client-side safety net: server-action/network failures surface as thrown
 * errors (fetch failures never reach the server). Maps them to safe codes.
 */
export async function safeCall<T>(promise: Promise<T>): Promise<T | ActionError> {
  try {
    return await promise;
  } catch (err) {
    const msg = String((err as Error)?.message ?? err);
    const code = /fetch|network|offline|failed to fetch|internet/i.test(msg)
      ? "NETWORK"
      : "GENERAL";
    return { ok: false, error: ERROR_MESSAGES[code], code, requestId: "" };
  }
}
