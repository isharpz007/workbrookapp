import { Suspense } from "react";
import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ManageForm } from "@/components/manage-form";
import { getManageEntry } from "@/server/actions/manage";

export const metadata: Metadata = {
  title: "Manage entry",
  robots: { index: false },
};

async function ManageContent({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const entry = await getManageEntry(token);

  if (!entry) {
    return (
      <div className="mx-auto max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Link invalid or expired</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            This manage link doesn&apos;t work — it may have expired or been
            used already. Visit <strong>My entries</strong> to request a fresh
            link by email.
          </CardContent>
        </Card>
      </div>
    );
  }

  return <ManageForm credential={token} entry={entry} />;
}

export default function ManagePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      }
    >
      <ManageContent params={params} />
    </Suspense>
  );
}
