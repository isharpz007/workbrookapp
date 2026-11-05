"use client";

import { useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  respondConsent,
  type ConsentAction,
} from "@/server/actions/consent";
import { safeCall } from "@/lib/client-errors";

const DONE_TEXT: Record<ConsentAction, string> = {
  confirm: "Confirmed. Thank you — the memory now shows your name.",
  keep_private: "Done. This memory stays private — it won't appear publicly.",
  remove: "Removed. This memory is gone and won't come back.",
};

export function ConsentActions({ token }: { token: string }) {
  const [busy, setBusy] = useState<ConsentAction | null>(null);
  const [done, setDone] = useState<ConsentAction | null>(null);

  async function act(action: ConsentAction) {
    setBusy(action);
    const res = await safeCall(respondConsent(token, action));
    setBusy(null);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setDone(action);
  }

  if (done) {
    return (
      <p className="rounded-lg bg-muted px-4 py-3 text-sm font-medium">
        {DONE_TEXT[done]}
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Button
        onClick={() => act("confirm")}
        disabled={busy !== null}
        className="bg-confirmed hover:bg-confirmed/90"
      >
        <BadgeCheck className="size-4" />
        {busy === "confirm" ? "Working…" : "Confirm"}
      </Button>
      <Button
        variant="outline"
        onClick={() => act("keep_private")}
        disabled={busy !== null}
      >
        <EyeOff className="size-4" />
        {busy === "keep_private" ? "Working…" : "Keep private"}
      </Button>
      <Button
        variant="destructive"
        onClick={() => act("remove")}
        disabled={busy !== null}
      >
        <Trash2 className="size-4" />
        {busy === "remove" ? "Working…" : "Remove"}
      </Button>
    </div>
  );
}
