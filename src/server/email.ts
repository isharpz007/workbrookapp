import { Resend } from "resend";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { stopEmails } from "@/db/schema";
import { hashEmail } from "@/lib/hash";
import { RATE_LIMITS } from "@/lib/constants";
import { allow } from "@/server/rate-limit";

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

/**
 * Per-recipient daily cap — the plan's guard against mailing a stranger
 * repeatedly. Applied to user-facing sends; the owner's report notice is
 * deliberately uncapped so abuse reports are never silently dropped.
 */
async function withinDailyCap(email: string) {
  return allow("email", hashEmail(email), RATE_LIMITS.emailPerAddressPerDay);
}

/** Every email footer carries a one-click "stop emailing me" link. */
function stopFooter(to: string) {
  const url = `${APP_URL()}/api/stop-email?h=${hashEmail(to)}`;
  return `<p style="color:#999;font-size:.75rem;margin-top:2rem">Don&#39;t want these emails? <a href="${url}" style="color:#999">Stop emailing me</a> — one click, no login.</p>`;
}

export async function sendConsentEmail(opts: {
  to: string;
  sentence: string;
  token: string;
}) {
  const client = getResend();
  if (!client) return { sent: false as const, reason: "RESEND_API_KEY unset" };
  if (await isSuppressed(opts.to)) return { sent: false as const, reason: "suppressed" };
  if (!(await withinDailyCap(opts.to))) return { sent: false as const, reason: "rate_limited" };

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
        ${stopFooter(opts.to)}
      </div>`,
  });
  return { sent: !error, error };
}

export async function sendReportNotice(opts: {
  memoryId: string;
  sentence: string;
  reason: string;
}) {
  const client = getResend();
  const to = process.env.OWNER_EMAIL;
  if (!client || !to) return { sent: false as const };
  const { error } = await client.emails.send({
    from: FROM(),
    to,
    subject: "A memory was reported and hidden",
    html: `
      <div style="font-family:sans-serif;max-width:32rem;margin:auto">
        <h2>Report received</h2>
        <p><strong>Reason:</strong> ${escapeHtml(opts.reason)}</p>
        <p><strong>Entry:</strong> ${escapeHtml(opts.sentence)}</p>
        <p>The entry is hidden until you review it in the admin panel.</p>
        <p><a href="${APP_URL()}/admin/reports">Review reports</a></p>
      </div>`,
  });
  return { sent: !error, error };
}

export async function sendRecoveryEmail(opts: {
  to: string;
  links: { sentence: string; url: string }[];
}) {
  const client = getResend();
  if (!client) return { sent: false as const };
  if (await isSuppressed(opts.to)) return { sent: false as const, reason: "suppressed" };
  if (!(await withinDailyCap(opts.to))) return { sent: false as const, reason: "rate_limited" };

  const items = opts.links
    .map(
      (l) =>
        `<li style="margin-bottom:.75rem"><a href="${l.url}">${escapeHtml(l.sentence)}</a><br><span style="color:#666;font-size:.85rem">${l.url}</span></li>`
    )
    .join("");

  const { error } = await client.emails.send({
    from: FROM(),
    to: opts.to,
    subject: "Your Workbrook Memory manage links",
    html: `
      <div style="font-family:sans-serif;max-width:32rem;margin:auto">
        <h2>Your manage links</h2>
        <p>Each link opens one of your entries so you can edit or remove it. Links work once and expire in 1 hour.</p>
        <ul>${items}</ul>
        ${stopFooter(opts.to)}
      </div>`,
  });
  return { sent: !error, error };
}

export async function sendExportEmail(opts: { to: string; url: string }) {
  const client = getResend();
  if (!client) return { sent: false as const, reason: "RESEND_API_KEY unset" };
  if (await isSuppressed(opts.to)) return { sent: false as const, reason: "suppressed" };
  if (!(await withinDailyCap(opts.to))) return { sent: false as const, reason: "rate_limited" };

  const { error } = await client.emails.send({
    from: FROM(),
    to: opts.to,
    subject: "Your Workbrook Memory export",
    html: `
      <div style="font-family:sans-serif;max-width:32rem;margin:auto">
        <h2>Your export is ready</h2>
        <p>This link downloads a CSV of every entry under your email. It works once and expires in 15 minutes.</p>
        <p><a href="${opts.url}" style="background:#3b6fd8;color:#fff;padding:.75rem 1.25rem;border-radius:.5rem;text-decoration:none">Download CSV</a></p>
        ${stopFooter(opts.to)}
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
