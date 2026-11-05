import { Suspense } from "react";
import type { Metadata } from "next";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MemoryCard } from "@/components/memory-card";
import { listPublicMemories } from "@/server/queries";
import { logError } from "@/server/logger";

export const metadata: Metadata = {
  title: "Memories",
  robots: { index: false },
};

type SearchParams = Promise<{ q?: string; status?: string }>;

async function MemoryList({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q = "", status = "" } = await searchParams;
  const statusFilter =
    status === "confirmed" || status === "not_yet_confirmed"
      ? status
      : undefined;

  let memories: Awaited<ReturnType<typeof listPublicMemories>> = [];
  let dbReady = true;
  try {
    memories = await listPublicMemories({ q, status: statusFilter });
  } catch (err) {
    logError(err, { action: "MemoryList" });
    dbReady = false;
  }

  if (!dbReady) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          The database isn&apos;t connected yet — set
          <code className="mx-1">DATABASE_URL</code> to your Supabase pooled
          URI.
        </CardContent>
      </Card>
    );
  }

  if (memories.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          {q
            ? `No memories match “${q}”.`
            : "No public memories yet — be the first to add one."}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {memories.map((m) => (
        <MemoryCard key={m.id} memory={m} href={`/memories/${m.id}`} />
      ))}
    </div>
  );
}

async function Controls({ searchParams }: { searchParams: SearchParams }) {
  const { q = "", status = "" } = await searchParams;
  const statusFilter =
    status === "confirmed" || status === "not_yet_confirmed" ? status : "";

  const filterLink = (s: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (s) p.set("status", s);
    const qs = p.toString();
    return `/memories${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-2xl font-semibold">Memories</h1>
        <form action="/memories" className="relative w-full sm:max-w-xs">
          {statusFilter && (
            <input type="hidden" name="status" value={statusFilter} />
          )}
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Name, work, place or year"
            className="pl-9"
          />
        </form>
      </div>

      <div className="flex gap-2 text-sm">
        {[
          { label: "All", value: "" },
          { label: "Confirmed", value: "confirmed" },
          { label: "Not yet confirmed", value: "not_yet_confirmed" },
        ].map((f) => (
          <a
            key={f.value}
            href={filterLink(f.value)}
            className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
              statusFilter === f.value
                ? "bg-brand text-white"
                : "bg-white text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>
    </>
  );
}

export default function MemoriesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="space-y-6">
      <Suspense
        fallback={
          <>
            <Skeleton className="h-10 w-56" />
            <Skeleton className="h-8 w-64" />
          </>
        }
      >
        <Controls searchParams={searchParams} />
      </Suspense>
      <Suspense
        fallback={
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        }
      >
        <MemoryList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
