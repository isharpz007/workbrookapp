"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TurnstileField } from "@/components/turnstile-field";
import { submitReport } from "@/server/actions/reports";
import { safeCall } from "@/lib/client-errors";
import { REPORT_REASONS } from "@/lib/validation";

const REASON_LABELS: Record<(typeof REPORT_REASONS)[number], string> = {
  about_me: "This entry is about me",
  false_info: "False information",
  abuse: "Harassment or abuse",
  other: "Other",
};

export function ReportDialog({ memoryId }: { memoryId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!reason) {
      toast.error("Please choose a reason.");
      return;
    }
    setBusy(true);
    const res = await safeCall(submitReport({
      memoryId,
      reason,
      details,
      turnstileToken,
    }));
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setOpen(false);
    toast.success("Reported. The entry is hidden while we review it.");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Flag className="size-4" /> Report this entry
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report this entry</DialogTitle>
          <DialogDescription>
            Reports hide the entry immediately while it&apos;s reviewed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={(v) => setReason(String(v))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a reason" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {REASON_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-details">
              Details{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="report-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>

          <TurnstileField onToken={(t) => setTurnstileToken(t ?? "")} />

          <Button onClick={submit} disabled={busy} className="w-full">
            {busy ? "Sending…" : "Send report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
