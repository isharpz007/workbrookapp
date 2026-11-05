import { ERROR_MESSAGES } from "./error-codes";

/** Maps Supabase auth error text to safe, friendly messages. */
export function mapAuthError(message: string | undefined): string {
  const m = (message ?? "").toLowerCase();
  if (/invalid login|invalid credential|wrong password/.test(m))
    return ERROR_MESSAGES.INVALID_CREDENTIALS;
  if (/email not confirmed|confirm your email/.test(m))
    return "Please confirm your email first — check your inbox.";
  if (/already registered|already been registered|already exists/.test(m))
    return "An account with this email already exists. Try logging in.";
  if (/rate limit|too many|over_email_send/.test(m))
    return ERROR_MESSAGES.RATE_LIMITED;
  if (/expired|session/.test(m)) return ERROR_MESSAGES.SESSION_EXPIRED;
  if (/password/.test(m) && /weak|short|least/.test(m))
    return "Please choose a stronger password (at least 8 characters).";
  if (/fetch|network|offline|failed to fetch/.test(m))
    return ERROR_MESSAGES.NETWORK;
  return ERROR_MESSAGES.GENERAL;
}
