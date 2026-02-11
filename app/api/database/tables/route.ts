import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function POST(request: Request) {
  try {
    const { connectionUrl } = await request.json();

    if (!connectionUrl) {
      return NextResponse.json(
        { error: 'Connection URL is required' },
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

    // Get all tables from the database
    const client = await pool.connect();
    
    // Query to get all tables in the public schema
    const tablesResult = await client.query(`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.tables t2 
              WHERE t2.table_name = t1.table_name) as row_count
      FROM information_schema.tables t1
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    client.release();
    await pool.end();

    return NextResponse.json({
      success: true,
      tables: tablesResult.rows
    });

  } catch (error) {
    console.error('Failed to load tables:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to load tables' 
      },
      { status: 500 }
    );
  }
}