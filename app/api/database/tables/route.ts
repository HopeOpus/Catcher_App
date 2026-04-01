import { NextResponse } from "next/server";
import { createDatabaseBrowserPool, getDatabaseBrowserAccess } from "@/lib/database-browser-access";
import type { Pool, PoolClient } from "pg";

export async function GET() {
  const access = await getDatabaseBrowserAccess();

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  let pool: Pool | null = null;
  let client: PoolClient | null = null;

  try {
    pool = createDatabaseBrowserPool();
    client = await pool.connect();

    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const tables = [];

    for (const row of tablesResult.rows as Array<{ table_name: string }>) {
      const safeTableName = `"${row.table_name.replace(/"/g, '""')}"`;
      const countResult = await client.query(
        `SELECT COUNT(*)::int AS row_count FROM ${safeTableName}`,
      );

      tables.push({
        table_name: row.table_name,
        row_count: Number(countResult.rows[0]?.row_count ?? 0),
      });
    }

    return NextResponse.json({
      success: true,
      tables,
    });
  } catch (error) {
    console.error("Failed to load tables:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load tables";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    );
  } finally {
    client?.release();
    await pool?.end();
  }
}
