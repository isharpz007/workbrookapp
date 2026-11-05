"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicKey } from "@/lib/supabase/config";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getSupabasePublicKey();
  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Set the project URL and publishable key."
    );
  }
  return createBrowserClient(url, key);
}
