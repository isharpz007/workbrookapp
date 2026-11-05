import postgres from "postgres";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

let cached: PostgresJsDatabase<typeof schema> | null = null;

/**
 * Supabase Postgres. Point DATABASE_URL at the pooled connection URI
 * (Project Settings → Database → Connection string).
 * `prepare: false` is required for Supabase's transaction pooler.
 */
export function getDb() {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not configured. Add your Supabase pooled connection URI to .env.local."
    );
  }
  cached = drizzle(postgres(url, { prepare: false }), { schema });
  return cached;
}
