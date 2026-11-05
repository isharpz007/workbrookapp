import { ZodError } from "zod";
import {
  ERROR_MESSAGES,
  type ActionError,
  type ErrorCode,
} from "@/lib/error-codes";
import { logError, logWarn } from "./logger";

/** Operational error — its message IS safe to show to users. */
export class AppError extends Error {
  readonly code: ErrorCode;
  constructor(code: ErrorCode, userMessage?: string) {
    super(userMessage ?? ERROR_MESSAGES[code]);
    this.code = code;
  }
}

/** Throw a classified, user-safe error inside any action. */
export function fail(code: ErrorCode, userMessage?: string): never {
  throw new AppError(code, userMessage);
}

/** Map any thrown error to a code — internals never reach the user. */
function classify(err: unknown): ErrorCode {
  if (err instanceof AppError) return err.code;
  if (err instanceof ZodError) return "VALIDATION";
  const msg =
    `${(err as Error)?.name ?? ""} ${(err as Error)?.message ?? String(err)}`.toLowerCase();
  if (/not configured|database_url|env/.test(msg)) return "UNAVAILABLE";
  if (/econn|enotfound|etimedout|fetch failed|network/.test(msg))
    return "NETWORK";
  if (/timeout|timed out|aborterror/.test(msg)) return "TIMEOUT";
  if (/jwt|unauthorized|401|invalid token|session expired/.test(msg))
    return "SESSION_EXPIRED";
  if (/forbidden|permission|403/.test(msg)) return "FORBIDDEN";
  if (/duplicate|unique|already exists|23505/.test(msg)) return "DUPLICATE";
  if (/not found|404/.test(msg)) return "NOT_FOUND";
  if (/postgres|sql|database|query/.test(msg)) return "SERVER";
  return "GENERAL";
}

export function toActionError(
  err: unknown,
  requestId: string,
  actionName: string
): ActionError {
  const code = classify(err);
  const safe =
    err instanceof AppError ? err.message : ERROR_MESSAGES[code];

  // Expected business errors → warn; anything else → full internal log.
  if (err instanceof AppError) {
    logWarn(`[${actionName}] ${code}: ${err.message}`, {
      requestId,
      action: actionName,
      code,
    });
  } else {
    logError(err, { requestId, action: actionName, code });
  }

  return { ok: false, error: safe, code, requestId };
}

/**
 * Wraps a server action: correlation id + classification + logging +
 * sanitised response. Business logic throws via `fail()` — never returns
 * raw errors.
 */
export function action<A extends unknown[], R>(
  name: string,
  fn: (...args: A) => Promise<R>
): (...args: A) => Promise<R | ActionError> {
  return async (...args: A) => {
    const requestId = crypto.randomUUID();
    try {
      return await fn(...args);
    } catch (err) {
      return toActionError(err, requestId, name);
    }
  };
}

/** Hard timeout — temporary failures recover fast instead of hanging. */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new AppError("TIMEOUT")), ms)
    ),
  ]);
}
