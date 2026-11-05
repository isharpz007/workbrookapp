"use client";

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {

    // just incase this dosent realy do anything but just in case
    throw new Error(
      "sorry, something went wrong please try again later or contact support"
    );
  }
  return createBrowserClient(url, key);
}
