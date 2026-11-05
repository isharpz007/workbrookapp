import { Suspense } from "react";
import Link from "next/link";
import { HandHeart, Handshake, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MemoryCard } from "@/components/memory-card";
import { listPublicMemories } from "@/server/queries";
import { logError } from "@/server/logger";
import type { PublicMemory } from "@/lib/public-memory";

// Shown until the database has real public entries.
const EXAMPLES: PublicMemory[] = [
  {
    id: "example-1",
    personName: "Ada O.",
    sentence: "Ada O. from Lagos helped me find work.",
    jobTitle: "Electrician",
    year: 2019,
    city: "Lagos",
    region: null,
    status: "confirmed",
    createdAt: new Date().toISOString(),
  },
  {
    id: "example-2",
    personName: "C. O.",
    sentence: "I helped C. O. from Abuja find work.",
    jobTitle: "Nurse",
    year: 2021,
    city: "Abuja",
    region: null,
    status: "not_yet_confirmed",
    createdAt: new Date().toISOString(),
  },
];

async function HomeFeed() {
  let feed = EXAMPLES;
  let real = false;
  try {
    const rows = await listPublicMemories({ limit: 4 });
    if (rows.length > 0) {
      feed = rows;
      real = true;
    }
  } catch (err) {
    logError(err, { action: "HomeFeed" });
    // DB not configured yet — show examples.
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {feed.map((m) => (
        <MemoryCard
          key={m.id}
          memory={m}
          href={real ? `/memories/${m.id}` : undefined}
        />
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
            placeholder="Search by name, work, company or place"
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
