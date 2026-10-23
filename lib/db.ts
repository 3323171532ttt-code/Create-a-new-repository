import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL || "";

// Re-use pool across hot reloads in Next.js development
const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
};

export const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: connectionString || undefined,
    ssl:
      connectionString.includes("supabase.co") ||
      connectionString.includes("sslmode=require") ||
      connectionString.includes("pooler.supabase.com")
        ? { rejectUnauthorized: false }
        : undefined,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

/**
 * Returns true if DATABASE_URL is set with a non-empty connection string.
 */
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== "");
}
