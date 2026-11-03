"use client";

import { Turnstile } from "@marsidev/react-turnstile";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/** Renders the human check only when a site key is configured. */
export function TurnstileField({
  onToken,
}: {
  onToken: (token: string | undefined) => void;
}) {
  if (!SITE_KEY) return null;
  return (
    <Turnstile
      siteKey={SITE_KEY}
      onSuccess={(t) => onToken(t)}
      onExpire={() => onToken(undefined)}
      onError={() => onToken(undefined)}
    />
  );
}
