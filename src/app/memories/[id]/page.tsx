import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { ThankYouDialog } from "@/components/thank-you-dialog";
import { ReportDialog } from "@/components/report-dialog";
import { formatMemoryDate } from "@/lib/format-date";
import { getPublicMemory } from "@/server/queries";
import { logError } from "@/server/logger";
import { getDb } from "@/db/client";
import { memories } from "@/db/schema";

export const metadata: Metadata = {
  title: "Memory",
  robots: { index: false },
};

async function MemoryDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const memory = await getPublicMemory(id).catch((err) => {
    logError(err, { action: "MemoryDetail" });
    throw err;
  });
  if (!memory) notFound();

  let thanks = 0;
  try {
    const [row] = await getDb()
      .select({ t: memories.thanksCount })
      .from(memories)
      .where(eq(memories.id, id))
      .limit(1);
    thanks = row?.t ?? 0;
  } catch {
    thanks = 0;
  }

  const meta = [
    memory.jobTitle,
    formatMemoryDate(memory.year, memory.month, memory.day),
    memory.company,
    memory.workLocation ?? memory.region ?? memory.city,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card>
      <CardContent className="space-y-5 py-6">
        <p className="text-xl font-medium leading-snug">{memory.sentence}</p>
        {meta && <p className="text-sm text-muted-foreground">{meta}</p>}
        {memory.thankYouMessage && (
          <blockquote className="border-l-2 border-gold/60 pl-4 text-sm italic leading-6 text-slate-600">
            {memory.thankYouMessage}
          </blockquote>
        )}
        <StatusBadge confirmed={memory.status === "confirmed"} />
        <div className="flex flex-wrap gap-2 pt-2">
          <ThankYouDialog memoryId={memory.id} initialCount={thanks} />
          <ReportDialog memoryId={memory.id} />
        </div>
      </CardContent>
    </Card>
  );
}

export default function MemoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="mx-auto max-w-lg">
      <Suspense
        fallback={
          <Card>
            <CardContent className="space-y-4 py-6">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-9 w-32" />
            </CardContent>
          </Card>
        }
      >
        <MemoryDetail params={params} />
      </Suspense>
    </div>
  );
}
