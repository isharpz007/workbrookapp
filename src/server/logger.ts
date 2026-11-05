/**
 * Internal logging layer. Structured JSON to stderr/stdout — captured by
 * Vercel logs. NEVER send this output to the client.
 *
 * Redacts secrets and personal data: passwords, tokens, keys, cookies,
 * auth headers, secrets, and email local-parts.
 */

const SENSITIVE_KEY =
  /pass(word)?|secret|token|api[-_]?key|authorization|cookie|session|credential/i;

function maskString(s: string): string {
  // Mask email local parts and bearer-style secrets inside strings.
  return s
    .replace(/[\w.+-]+@([\w-]+)/g, "***@$1")
    .replace(/(bearer\s+)[^\s"']+/gi, "$1[redacted]")
    .replace(/([a-f0-9]{32,})/gi, "[hash]");
}

function redact(value: unknown, key = "", depth = 0): unknown {
  if (depth > 6) return "[depth-limited]";
  if (SENSITIVE_KEY.test(key)) return "[redacted]";
  if (typeof value === "string") return maskString(value);
  if (Array.isArray(value)) return value.map((v) => redact(v, "", depth + 1));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, redact(v, k, depth + 1)])
    );
  }
  return value;
}

type LogContext = {
  requestId?: string;
  action?: string;
  code?: string;
  meta?: Record<string, unknown>;
};

function emit(level: "info" | "warn" | "error", event: Record<string, unknown>) {
  // Deferred out of the render tick — logging is a side effect and must not
  // participate in prerender determinism (Cache Components rule).
  setTimeout(() => {
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      level,
      ...event,
    });
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
  }, 0);
}

export function logError(err: unknown, ctx: LogContext = {}) {
  const e = err as Error & { code?: string; cause?: unknown };
  emit("error", {
    event: "error",
    requestId: ctx.requestId,
    action: ctx.action,
    code: ctx.code,
    name: e?.name,
    message: e?.message ? maskString(String(e.message)) : String(err),
    stack: e?.stack ? maskString(e.stack) : undefined,
    meta: ctx.meta ? redact(ctx.meta) : undefined,
  });
}

export function logWarn(message: string, ctx: LogContext = {}) {
  emit("warn", {
    event: "warn",
    requestId: ctx.requestId,
    action: ctx.action,
    code: ctx.code,
    message: maskString(message),
    meta: ctx.meta ? redact(ctx.meta) : undefined,
  });
}

export function logInfo(message: string, ctx: LogContext = {}) {
  emit("info", {
    event: "info",
    requestId: ctx.requestId,
    action: ctx.action,
    message: maskString(message),
    meta: ctx.meta ? redact(ctx.meta) : undefined,
  });
}
