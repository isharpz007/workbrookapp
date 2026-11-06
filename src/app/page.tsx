import { Suspense } from "react";
import Link from "next/link";
import { HandHeart, Handshake, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MemoryCard } from "@/components/memory-card";
import { listPublicMemories } from "@/server/queries";
import { logError } from "@/server/logger";

async function HomeFeed() {
  let rows: Awaited<ReturnType<typeof listPublicMemories>> = [];
  try {
    rows = await listPublicMemories({ limit: 4 });
  } catch (err) {
    logError(err, { action: "HomeFeed" });
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No work memories yet! be the first to record one.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {rows.map((m) => (
        <MemoryCard key={m.id} memory={m} href={`/memories/${m.id}`} />
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold sm:text-3xl">
          Record who helped you land work.
        </h1>
        <form action="/memories" className="relative max-w-xl">
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            name="q"
            type="search"
            placeholder="Search by name, work, company or place"
            aria-label="Search work memories"
            className="pl-9"
          />
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/add">
          <Card className="h-full border-brand/30 transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4">
              <span className="flex size-12 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <HandHeart className="size-6" aria-hidden />
              </span>
              <div>
                <p className="font-semibold">Someone helped me</p>
                <p className="text-sm text-muted-foreground">
                  Record the person who helped you find work.
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/add">
          <Card className="h-full border-gold/40 transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4">
              <span className="flex size-12 items-center justify-center rounded-xl bg-gold/10 text-gold">
                <Handshake className="size-6" aria-hidden />
              </span>
              <div>
                <p className="font-semibold">I helped someone</p>
                <p className="text-sm text-muted-foreground">
                  Record the work you helped someone land.
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        }
      >
        <HomeFeed />
      </Suspense>
    </div>
  );
}
