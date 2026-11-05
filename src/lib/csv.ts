import type { Memory } from "@/db/schema";

const csvEsc = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const HEADER =
  "id,direction,first_name,last_initial,city,region,job,year,status,thanks,created_at";

/** CSV of a user's own entries — shared by the action and /api/export. */
export function memoriesToCsv(rows: Memory[]) {
  const body = rows
    .map((r) =>
      [
        r.id,
        r.direction,
        r.personFirstName,
        r.personLastInitial,
        r.personCity,
        r.personRegion,
        r.jobTitle,
        r.year,
        r.status,
        r.thanksCount,
        r.createdAt.toISOString(),
      ]
        .map(csvEsc)
        .join(",")
    )
    .join("\n");
  return `${HEADER}\n${body}\n`;
}
