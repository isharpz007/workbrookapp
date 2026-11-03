import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import type { PublicMemory } from "@/lib/public-memory";

export function MemoryCard({
  memory,
  href,
}: {
  memory: PublicMemory;
  /** When omitted the card is static (e.g. homepage examples). */
  href?: string;
}) {
  const meta = [memory.jobTitle, memory.year, memory.region ?? memory.city]
    .filter(Boolean)
    .join(" · ");

  const card = (
    <Card className="h-full transition-shadow hover:shadow-md">
      <CardContent className="space-y-3">
        <p className="font-medium leading-snug">{memory.sentence}</p>
        {meta && <p className="text-sm text-muted-foreground">{meta}</p>}
        <StatusBadge confirmed={memory.status === "confirmed"} />
      </CardContent>
    </Card>
  );

  return href ? (
    <Link href={href} className="block">
      {card}
    </Link>
  ) : (
    card
  );
}
