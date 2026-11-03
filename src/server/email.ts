import { Resend } from "resend";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { stopEmails } from "@/db/schema";
import { hashEmail } from "@/lib/hash";

let resend: Resend | null = null;
function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  resend ??= new Resend(process.env.RESEND_API_KEY);
  return resend;
}

const FROM = () => process.env.EMAIL_FROM ?? "Workbrook <noreply@workbrook.app>";
const APP_URL = () => process.env.APP_URL ?? "http://localhost:3000";

/** Recipients on the stop-emailing list are never mailed. */
export async function isSuppressed(email: string) {
  const rows = await getDb()
    .select({ emailHash: stopEmails.emailHash })
    .from(stopEmails)
    .where(eq(stopEmails.emailHash, hashEmail(email)));
  return rows.length > 0;
}

export async function sendConsentEmail(opts: {
  to: string;
  sentence: string;
  token: string;
}) {
  const client = getResend();
  if (!client) return { sent: false as const, reason: "RESEND_API_KEY unset" };
  if (await isSuppressed(opts.to)) return { sent: false as const, reason: "suppressed" };

  const url = `${APP_URL()}/named/${opts.token}`;
  const { error } = await client.emails.send({
    from: FROM(),
    to: opts.to,
    subject: "Someone has named you on Workbrook Memory",
    html: `
      <div style="font-family:sans-serif;max-width:32rem;margin:auto">
        <h2>Someone has named you.</h2>
        <p style="font-size:1.1rem">${escapeHtml(opts.sentence)}</p>
        <p>What would you like to do?</p>
        <p><a href="${url}" style="background:#3b6fd8;color:#fff;padding:.75rem 1.25rem;border-radius:.5rem;text-decoration:none">Review this memory</a></p>
        <p style="color:#666;font-size:.85rem">You can confirm it, keep it private, or have it removed. This link works once and expires in 7 days.</p>
      </div>`,
  });
  return { sent: !error, error };
}

function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c]!
  );
}
