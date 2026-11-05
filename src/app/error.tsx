"use client";

import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ERROR_MESSAGES } from "@/lib/error-codes";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg py-10">
      <Card>
        <CardContent className="space-y-4 py-8 text-center">
          <TriangleAlert
            className="mx-auto size-10 text-gold"
            aria-hidden
          />
          <p className="text-lg font-medium">{ERROR_MESSAGES.SERVER}</p>
          {error.digest && (
            <p className="text-xs text-muted-foreground">
              Reference: {error.digest}
            </p>
          )}
          <div className="flex justify-center gap-2 pt-2">
            <Button onClick={reset}>Try again</Button>
            <Link href="/">
              <Button variant="outline">Home</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
