"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TurnstileField } from "@/components/turnstile-field";
import { sendThankYou } from "@/server/actions/manage";
import { safeCall } from "@/lib/client-errors";
import { cn } from "@/lib/utils";

const DELIVERY_MESSAGES = {
  sent: "Thank-you sent to the helper.",
  failed: "Thank-you saved — the email couldn't be delivered.",
  not_sent: "Thank-you recorded — the helper left no contact details.",
} as const;

export function ThankYouDialog({
  memoryId,
  initialCount,
}: {
  memoryId: string;
  initialCount: number;
}) {
  const [count, setCount] = useState(initialCount);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [token, setToken] = useState("");
  const [sending, setSending] = useState(false);

  async function submit() {
    if (!message.trim()) return;
    setSending(true);
    const res = await safeCall(
      sendThankYou(memoryId, { message, turnstileToken: token })
    );
    setSending(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setCount(res.count);
    setMessage("");
    setOpen(false);
    toast.success(DELIVERY_MESSAGES[res.delivery]);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Heart className="size-4" aria-hidden />
            Say thank you
            {count > 0 && (
              <span className="text-muted-foreground">· {count}</span>
            )}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Say thank you</DialogTitle>
          <DialogDescription>
            A short note goes to the helper if they left contact details — and
            is kept with this memory either way.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="ty-message" className="sr-only">
              Your message
            </Label>
            <Textarea
              id="ty-message"
              rows={4}
              maxLength={500}
              placeholder="Thank you for the help…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <TurnstileField onToken={(t) => setToken(t ?? "")} />
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className={cn("flex-1")}
              onClick={submit}
              disabled={sending || !message.trim()}
            >
              <Heart className="size-4" aria-hidden />
              {sending ? "Sending…" : "Send"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
