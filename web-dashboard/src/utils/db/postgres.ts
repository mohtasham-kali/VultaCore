import { Pool } from "pg";

let pool: Pool | null = null;

export function getPgPool(): Pool | null {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;

  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes("supabase.co")
        ? { rejectUnauthorized: false }
        : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}

export async function queryDb<T = any>(
  text: string,
  params?: any[],
): Promise<T[]> {
  const pool = getPgPool();
  if (!pool) {
    throw new Error("DATABASE_URL is not set");
  }
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res.rows;
  } finally {
    client.release();
  }
}

