import { NextResponse } from 'next/server';
import { Pool, type PoolClient } from 'pg';

export async function POST(request: Request) {
  let pool: Pool | null = null;
  let client: PoolClient | null = null;

  try {
    const { connectionUrl } = await request.json();

    if (!connectionUrl) {
      return NextResponse.json(
        { error: 'Connection URL is required' },
        { status: 400 }
      );
    }

    // Create a connection
    pool = new Pool({
      connectionString: connectionUrl,
      ssl: {
        rejectUnauthorized: false
      }
    });

    // Get all tables from the database
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
      const countResult = await client.query(`SELECT COUNT(*)::int AS row_count FROM ${safeTableName}`);

      tables.push({
        table_name: row.table_name,
        row_count: Number(countResult.rows[0]?.row_count ?? 0),
      });
    }

    return NextResponse.json({
      success: true,
      tables
    });

  } catch (error) {
    console.error('Failed to load tables:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to load tables';
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      },
      { status: 500 }
    );
  } finally {
    client?.release();
    await pool?.end();
  }
}
