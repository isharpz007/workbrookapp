import type { Memory } from "@/db/schema";

const csvEsc = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const HEADER =
  "id,direction,first_name,last_initial,city,region,work_location,job,company,year,month,day,status,thanks,created_at";

/** CSV of a user's own entries — private contact fields are never included. */
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
        r.workLocation,
        r.jobTitle,
        r.company,
        r.year,
        r.month,
        r.day,
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
