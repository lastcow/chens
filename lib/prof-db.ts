import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.PROF_DATABASE_URL });

export async function profQuery<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const { rows } = await pool.query(sql, params);
  return rows as T[];
}
