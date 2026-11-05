import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ERROR_MESSAGES } from "@/lib/error-codes";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-10">
      <Card>
        <CardContent className="space-y-4 py-8 text-center">
          <p className="text-lg font-medium">{ERROR_MESSAGES.NOT_FOUND}</p>
          <p className="text-sm text-muted-foreground">
            The page or entry you&apos;re looking for doesn&apos;t exist or was
            removed.
          </p>
          <Link href="/" className="inline-block pt-2">
            <Button>Back home</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
