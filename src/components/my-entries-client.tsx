"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { TurnstileField } from "@/components/turnstile-field";
import { getMyEntries, requestManageLink } from "@/server/actions/manage";
import { safeCall } from "@/lib/client-errors";
import { useManageLinks } from "@/stores/manage-links";

type Entry = Extract<
  Awaited<ReturnType<typeof getMyEntries>>,
  readonly unknown[]
>[number];

const STATUS_LABELS: Record<string, string> = {
  private: "Only me",
  pending_consent: "Not yet confirmed",
  confirmed: "Confirmed",
  hidden: "Hidden (under review)",
  removed: "Removed",
};

export function MyEntriesClient() {
  const links = useManageLinks((s) => s.links);
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [email, setEmail] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const secrets = Object.values(links);
    const load = secrets.length
      ? safeCall(getMyEntries(secrets))
      : Promise.resolve([]);
    load
      .then((rows) => {
        if (!cancelled) setEntries(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      });
    return () => {
      cancelled = true;
    };
  }, [links]);

  async function recover() {
    setSending(true);
    const res = await safeCall(requestManageLink({ email, turnstileToken }));
    setSending(false);
    if (res.ok) toast.success(res.message);
    else toast.error(res.error);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">My entries</h1>

      {entries === null ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No entries found on this device. Entries you add show up here via
            your saved manage links.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((e) => (
            <Link key={e.id} href={`/manage/${e.secret}`} className="block">
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium leading-snug">{e.sentence}</p>
                    {e.meta && (
                      <p className="text-sm text-muted-foreground">{e.meta}</p>
                    )}
                  </div>
                  {e.status === "confirmed" || e.status === "pending_consent" ? (
                    <StatusBadge confirmed={e.status === "confirmed"} />
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground">
                      {STATUS_LABELS[e.status]}
                    </span>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lost your manage link?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Enter the email you used when adding an entry and we&apos;ll send
            fresh one time links.
          </p>
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="recover-email" className="sr-only">
                Your email
              </Label>
              <Input
                id="recover-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              onClick={recover}
              disabled={sending || !email}
            >
              <Mail className="size-4" />
              {sending ? "Sending…" : "Send links"}
            </Button>
          </div>
          <TurnstileField onToken={(t) => setTurnstileToken(t ?? "")} />
        </CardContent>
      </Card>
    </div>
  );
}
