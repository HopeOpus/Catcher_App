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

    const result = await client.query("SELECT NOW() as current_time");

    return NextResponse.json({
      success: true,
      message: "Connection successful",
      currentTime: result.rows[0]?.current_time,
      connectedAs: access.user.email,
    });
  } catch (error) {
    console.error("Database connection test failed:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Connection failed";

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
