/**
 * The ONLY error text users ever see. Codes are safe to return to clients;
 * the messages never contain technical detail. Internal detail goes to logs.
 */

export const ERROR_MESSAGES = {
  NETWORK:
    "Unable to connect. Please check your internet connection and try again.",
  SERVER: "Something went wrong on our end. Please try again shortly.",
  INVALID_CREDENTIALS: "The email or password you entered is incorrect.",
  SESSION_EXPIRED: "Your session has expired. Please sign in again.",
  FORBIDDEN: "You don't have permission to perform this action.",
  REQUIRED_FIELD: "Please complete all required fields.",
  NOT_FOUND: "This information is currently unavailable.",
  TIMEOUT: "This is taking longer than expected. Please try again.",
  DUPLICATE: "This action has already been submitted.",
  UPLOAD: "We couldn't upload your file. Please try again.",
  VALIDATION:
    "Some information needs your attention. Please review your entries.",
  RATE_LIMITED:
    "You're doing that a bit too fast. Please try again in a moment.",
  HUMAN_CHECK: "We couldn't verify you're human. Please try again.",
  LINK_EXPIRED: "This link has expired or was already used.",
  UNAVAILABLE:
    "This service is temporarily unavailable. Please try again shortly.",
  GENERAL: "Something went wrong. Please try again.",
} as const;

export type ErrorCode = keyof typeof ERROR_MESSAGES;

/** The standardised, sanitised error response every action returns. */
export type ActionError = {
  ok: false;
  /** User-safe message — never technical. */
  error: string;
  code: ErrorCode;
  /** Correlation id — safe to show for support, links to internal logs. */
  requestId: string;
};
