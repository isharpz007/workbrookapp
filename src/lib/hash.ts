import { createHash } from "crypto";

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function hashEmail(email: string): string {
  return sha256(email.trim().toLowerCase());
}
