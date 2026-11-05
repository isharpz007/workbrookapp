import { Suspense } from "react";
import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminReports } from "@/components/admin-reports";
import { listReports } from "@/server/actions/reports";

export const metadata: Metadata = {
  title: "Reports",
  robots: { index: false },
};

async function ReportsContent({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key = "" } = await searchParams;

  let rows = null;
  try {
    rows = await listReports(key);
  } catch {
    rows = null;
  }

  if (!rows) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unauthorized</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Add <code>?key=YOUR_ADMIN_KEY</code> to the URL to review reports.
        </CardContent>
      </Card>
    );
  }

  return <AdminReports adminKey={key} initial={rows} />;
}

export default function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Open reports</h1>
      <Suspense fallback={<Skeleton className="h-40 w-full" />}>
        <ReportsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
