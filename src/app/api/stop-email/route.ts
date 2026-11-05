import { getDb } from "@/db/client";
import { stopEmails } from "@/db/schema";
import { logError } from "@/server/logger";

const PAGE = `<!doctype html>
<html lang="en">
<body style="font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#f5f7fb;color:#1f2430">
  <div style="text-align:center;max-width:22rem;padding:1rem">
    <h1 style="font-size:1.25rem">Done — no more emails</h1>
    <p>This address has been added to our stop-emailing list. Existing entries are not affected; if you want one removed, use the removal link on the entry itself.</p>
    <p><a href="/" style="color:#2e6bd6">Back to Workbrook Memory</a></p>
  </div>
</body>
</html>`;

/** One-click unsubscribe — carries the address's hash, never the address. */
export async function GET(request: Request) {
  const h =
    new URL(request.url).searchParams.get("h")?.toLowerCase() ?? "";

  if (/^[0-9a-f]{64}$/.test(h)) {
    try {
      await getDb()
        .insert(stopEmails)
        .values({ emailHash: h })
        .onConflictDoNothing();
    } catch (err) {
      logError(err, { action: "stopEmail" });
    }
  }

  return new Response(PAGE, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
