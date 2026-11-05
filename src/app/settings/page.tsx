import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Mail, UserRound } from "lucide-react";
import { ProfileSignOut } from "@/components/profile-sign-out";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { formatMemberSince } from "@/lib/format-member-since";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false },
};

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-2xl py-8">
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-foreground/10">
            <h1 className="text-2xl font-semibold">Settings</h1>
            <p className="mt-3 text-sm text-muted-foreground">Loading account settings…</p>
          </section>
        </main>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}

async function SettingsContent() {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-2xl py-8">
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-foreground/10">
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="mt-3 text-sm text-muted-foreground">Sign in to view your account settings.</p>
          <Link href="/login" className={`${buttonVariants()} mt-5`}>Sign in</Link>
        </section>
      </main>
    );
  }

  const metadataName = user.user_metadata?.full_name ?? user.user_metadata?.name;
  const name = typeof metadataName === "string" && metadataName.trim()
    ? metadataName.trim()
    : user.email?.split("@")[0] ?? "Your profile";
  const memberSince = formatMemberSince(user.created_at);

  return (
    <main className="mx-auto w-full max-w-2xl pb-8">
      <Link href="/profile" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Back to profile
      </Link>
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-foreground/10 sm:p-7">
        <div>
          <p className="text-sm font-medium text-brand">Workbrook</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-2 text-sm text-muted-foreground">Your account details and preferences.</p>
        </div>

        <section className="mt-6 rounded-xl border p-4 sm:p-5">
          <h2 className="font-semibold">Profile details</h2>
          <dl className="mt-4 divide-y text-sm">
            <div className="flex items-start gap-3 py-3 first:pt-0">
              <UserRound className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
              <div><dt className="text-xs text-muted-foreground">Name</dt><dd className="mt-1 font-medium">{name}</dd></div>
            </div>
            <div className="flex items-start gap-3 py-3">
              <Mail className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
              <div><dt className="text-xs text-muted-foreground">Account email</dt><dd className="mt-1 break-all font-medium">{user.email ?? "Not provided"}</dd></div>
            </div>
            <div className="flex items-start gap-3 py-3 last:pb-0">
              <CalendarDays className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
              <div><dt className="text-xs text-muted-foreground">Member since</dt><dd className="mt-1 font-medium">{memberSince}</dd></div>
            </div>
          </dl>
        </section>

        <div className="mt-6 border-t pt-5">
          <ProfileSignOut />
        </div>
      </section>
    </main>
  );
}
