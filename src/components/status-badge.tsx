import { BadgeCheck, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function StatusBadge({ confirmed }: { confirmed: boolean }) {
  return (
    <Badge
      className={cn(
        "gap-1",
        confirmed
          ? "bg-confirmed text-confirmed-foreground hover:bg-confirmed"
          : "bg-muted text-muted-foreground hover:bg-muted"
      )}
    >
      {confirmed ? (
        <>
          <BadgeCheck className="size-3.5" aria-hidden /> Confirmed
        </>
      ) : (
        <>
          <Clock className="size-3.5" aria-hidden /> Not yet confirmed
        </>
      )}
    </Badge>
  );
}
