import { NextResponse } from 'next/server';
import { Pool, type PoolClient } from 'pg';

const TABLE_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

export async function POST(request: Request) {
  let pool: Pool | null = null;
  let client: PoolClient | null = null;

  try {
    const { connectionUrl, tableName } = await request.json();

    if (!connectionUrl || !tableName) {
      return NextResponse.json(
        { error: 'Connection URL and table name are required' },
        { status: 400 }
      );
    }

    if (!TABLE_NAME_PATTERN.test(tableName)) {
      return NextResponse.json(
        { error: 'Invalid table name' },
        { status: 400 }
      );
    }

    pool = new Pool({
      connectionString: connectionUrl,
      ssl: {
        rejectUnauthorized: false
      }
    });

    client = await pool.connect();
    
    const columnsResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);

    if (columnsResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      );
    }

    const safeTableName = `"${tableName.replace(/"/g, '""')}"`;
    const dataResult = await client.query(`
      SELECT *
      FROM ${safeTableName}
      LIMIT 100
    `);

    return NextResponse.json({
      success: true,
      columns: columnsResult.rows.map((row: { column_name: string }) => row.column_name),
      rows: dataResult.rows
    });

  } catch (error) {
    console.error('Failed to load table data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to load table data';
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
