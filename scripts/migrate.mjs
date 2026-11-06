// Applies supabase/migrations/*.sql in order. With --reset, drops all
// public-schema tables, views, and enums first.
// Usage: node --env-file=.env.local scripts/migrate.mjs [--reset]
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });

if (process.argv.includes("--reset")) {
  console.log("Resetting public schema...");
  await sql.unsafe(`
    DO $$
    DECLARE r RECORD;
    BEGIN
      FOR r IN SELECT viewname AS n FROM pg_views WHERE schemaname = 'public' LOOP
        EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(r.n) || ' CASCADE';
      END LOOP;
      FOR r IN SELECT tablename AS n FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.n) || ' CASCADE';
      END LOOP;
      FOR r IN SELECT t.typname AS n FROM pg_type t
               JOIN pg_namespace n ON n.oid = t.typnamespace
               WHERE n.nspname = 'public' AND t.typtype = 'e' LOOP
        EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.n) || ' CASCADE';
      END LOOP;
    END $$;
  `);
  console.log("Reset done.");
}

const dir = join(root, "supabase", "migrations");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
for (const file of files) {
  const statements = readFileSync(join(dir, file), "utf8")
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const stmt of statements) {
    await sql.unsafe(stmt);
  }
  console.log(`applied ${file} (${statements.length} statements)`);
}

await sql.end();
console.log("All migrations applied.");
