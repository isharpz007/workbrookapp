import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "My entries",
  robots: { index: false },
};

export default function MyEntriesPage() {
  return (
    <Card>
      <CardContent className="py-10 text-center text-muted-foreground">
        Managing and exporting your own entries arrives in Phase 5.
      </CardContent>
    </Card>
  );
}
