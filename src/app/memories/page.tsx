import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Memories",
  robots: { index: false },
};

export default function MemoriesPage() {
  return (
    <Card>
      <CardContent className="py-10 text-center text-muted-foreground">
        The public memory wall arrives in Phase 4 — after consent and
        reporting are in place.
      </CardContent>
    </Card>
  );
}
