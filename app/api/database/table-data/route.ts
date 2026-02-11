import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function POST(request: Request) {
  try {
    const { connectionUrl, tableName } = await request.json();

    if (!connectionUrl || !tableName) {
      return NextResponse.json(
        { error: 'Connection URL and table name are required' },
        { status: 400 }
      );
    }

    // Create a connection
    const pool = new Pool({
      connectionString: connectionUrl,
      ssl: {
        rejectUnauthorized: false
      }
    });

    const client = await pool.connect();
    
    // Get table columns
    const columnsResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);

    // Get table data (limit to first 100 rows for performance)
    const dataResult = await client.query(`
      SELECT *
      FROM ${tableName}
      LIMIT 100
    `);

    client.release();
    await pool.end();

    return NextResponse.json({
      success: true,
      columns: columnsResult.rows.map(row => row.column_name),
      rows: dataResult.rows
    });

  } catch (error) {
    console.error('Failed to load table data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to load table data' 
      },
      { status: 500 }
    );
  }
}