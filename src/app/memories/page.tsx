import { Suspense } from "react";
import type { Metadata } from "next";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MemoryCard } from "@/components/memory-card";
import { listMemoryYears, listPublicMemories } from "@/server/queries";
import { logError } from "@/server/logger";

export const metadata: Metadata = {
  title: "Memories",
  robots: { index: false },
};

type SearchParams = Promise<{
  q?: string;
  status?: string;
  type?: string;
  year?: string;
}>;

async function MemoryList({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q = "", status = "", type = "", year = "" } = await searchParams;
  const statusFilter =
    status === "confirmed" || status === "not_yet_confirmed"
      ? status
      : undefined;
  const direction =
    type === "someone_helped_me" || type === "i_helped_someone"
      ? type
      : undefined;
  const yearFilter = /^\d{4}$/.test(year) ? Number(year) : undefined;

  let memories: Awaited<ReturnType<typeof listPublicMemories>> = [];
  let dbReady = true;
  try {
    memories = await listPublicMemories({
      q,
      status: statusFilter,
      direction,
      year: yearFilter,
    });
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
            : "No public memories yet! be the first to add one."}
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
  const { q = "", status = "", type = "", year = "" } = await searchParams;
  const statusFilter =
    status === "confirmed" || status === "not_yet_confirmed" ? status : "";
  const direction =
    type === "someone_helped_me" || type === "i_helped_someone" ? type : "";

  let years: number[] = [];
  try {
    years = await listMemoryYears();
  } catch {
    years = [];
  }

  const filterLink = (patch: Record<string, string>) => {
    const p = new URLSearchParams();
    const merged = { q, status: statusFilter, type: direction, year, ...patch };
    for (const [k, v] of Object.entries(merged)) {
      const val = k === "status" ? statusFilter : k === "type" ? direction : v;
      if (val) p.set(k, val);
    }
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
          {direction && <input type="hidden" name="type" value={direction} />}
          {year && <input type="hidden" name="year" value={year} />}
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

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Type
        </span>
        {[
          { label: "All", value: "" },
          { label: "Helped me", value: "someone_helped_me" },
          { label: "I helped", value: "i_helped_someone" },
        ].map((f) => (
          <a
            key={f.value}
            href={filterLink({ type: f.value })}
            className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
              direction === f.value
                ? "bg-brand text-white"
                : "bg-white text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Status
        </span>
        {[
          { label: "All", value: "" },
          { label: "Confirmed", value: "confirmed" },
          { label: "Not yet confirmed", value: "not_yet_confirmed" },
        ].map((f) => (
          <a
            key={f.value}
            href={filterLink({ status: f.value })}
            className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
              statusFilter === f.value
                ? "bg-brand text-white"
                : "bg-white text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </a>
        ))}

        {years.length > 0 && (
          <form action="/memories" className="ml-auto flex items-center gap-2">
            {q && <input type="hidden" name="q" value={q} />}
            {statusFilter && (
              <input type="hidden" name="status" value={statusFilter} />
            )}
            {direction && (
              <input type="hidden" name="type" value={direction} />
            )}
            <label
              htmlFor="year-filter"
              className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              Year
            </label>
            <select
              id="year-filter"
              name="year"
              defaultValue={year}
              className="rounded-lg border bg-white px-2 py-1.5 text-sm text-foreground"
            >
              <option value="">All years</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Go
            </button>
          </form>
        )}
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
