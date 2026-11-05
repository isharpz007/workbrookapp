"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sayThanks } from "@/server/actions/manage";
import { safeCall } from "@/lib/client-errors";
import { cn } from "@/lib/utils";

export function ThanksButton({
  memoryId,
  initialCount,
}: {
  memoryId: string;
  initialCount: number;
}) {
  const [count, setCount] = useState(initialCount);
  const [sent, setSent] = useState(false);

  async function click() {
    if (sent) return;
    setSent(true);
    setCount((c) => c + 1); // optimistic
    const res = await safeCall(sayThanks(memoryId));
    if (res.ok && "count" in res) setCount(res.count);
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={click}
      disabled={sent}
      className={cn(sent && "border-confirmed text-confirmed")}
    >
      <Heart
        className={cn("size-4", sent && "fill-confirmed text-confirmed")}
        aria-hidden
      />
      {sent ? "Thanked" : "Say thank you"}
      {count > 0 && <span className="text-muted-foreground">· {count}</span>}
    </Button>
  );
}
