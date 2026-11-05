import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CompanyProfile } from "@/components/company-profile";

export const metadata: Metadata = {
  title: "TechNova",
  description: "Explore TechNova's workplace profile, reviews, jobs and salary insights.",
};

async function CompanyContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug !== "technova") notFound();

  return <CompanyProfile />;
}

export default function CompanyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4 py-6">
              <Skeleton className="h-16 w-16 rounded-2xl" />
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardContent>
          </Card>
          <Skeleton className="h-32 w-full" />
        </div>
      }
    >
      <CompanyContent params={params} />
    </Suspense>
  );
}
