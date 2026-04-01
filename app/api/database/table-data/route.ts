import { NextResponse } from "next/server";
import { createDatabaseBrowserPool, getDatabaseBrowserAccess } from "@/lib/database-browser-access";
import type { Pool, PoolClient } from "pg";

const TABLE_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

export async function GET(request: Request) {
  const access = await getDatabaseBrowserAccess();

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  let pool: Pool | null = null;
  let client: PoolClient | null = null;

  try {
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get("tableName");

    if (!tableName) {
      return NextResponse.json(
        { error: "tableName is required" },
        { status: 400 },
      );
    }

    if (!TABLE_NAME_PATTERN.test(tableName)) {
      return NextResponse.json(
        { error: "Invalid table name" },
        { status: 400 },
      );
    }

    pool = createDatabaseBrowserPool();
    client = await pool.connect();

    const columnsResult = await client.query(
      `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `,
      [tableName],
    );

    if (columnsResult.rows.length === 0) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    const safeTableName = `"${tableName.replace(/"/g, '""')}"`;
    const dataResult = await client.query(`
      SELECT *
      FROM ${safeTableName}
      LIMIT 100
    `);

    return NextResponse.json({
      success: true,
      columns: columnsResult.rows.map(
        (row: { column_name: string }) => row.column_name,
      ),
      rows: dataResult.rows,
    });
  } catch (error) {
    console.error("Failed to load table data:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load table data";

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
