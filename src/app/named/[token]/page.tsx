import { Suspense } from "react";
import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConsentActions } from "@/components/consent-actions";
import { getConsentInfo } from "@/server/actions/consent";

export const metadata: Metadata = {
  title: "Someone has named you",
  robots: { index: false },
};

async function ConsentCard({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const info = await getConsentInfo(token);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Someone has named you.</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {info.ok ? (
          <>
            <p className="text-lg font-medium leading-snug">{info.sentence}</p>
            {info.meta && (
              <p className="text-sm text-muted-foreground">{info.meta}</p>
            )}
            <p className="text-sm text-muted-foreground">
              What would you like to do? Your choice applies instantly — this
              link only works once.
            </p>
            <ConsentActions token={token} />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {"error" in info
              ? info.error
              : "This link has expired or was already used. If you believe a memory still names you, use the \u201cRequest removal\u201d link on the entry."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function NamedPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return (
    <div className="mx-auto max-w-lg">
      <Suspense
        fallback={
          <Card>
            <CardContent className="space-y-4 py-6">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        }
      >
        <ConsentCard params={params} />
      </Suspense>
    </div>
  );
}
