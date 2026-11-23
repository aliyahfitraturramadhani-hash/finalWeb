import { Pool } from "pg";

const pool =
  globalThis.pgPool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.pgPool = pool;
}

// QUERY DATABASE BIASA
export async function query(text, params = []) {
  const result = await pool.query(text, params);
  return result.rows;
}

// TRANSACTION DATABASE
export async function withTransaction(callback) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await callback(client);

    await client.query("COMMIT");

    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

