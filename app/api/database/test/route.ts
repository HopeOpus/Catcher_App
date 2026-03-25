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

    // Create a test connection
    pool = new Pool({
      connectionString: connectionUrl,
      ssl: {
        rejectUnauthorized: false
      }
    });

    // Test the connection
    client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');

    return NextResponse.json({
      success: true,
      message: 'Connection successful',
      currentTime: result.rows[0].current_time
    });

  } catch (error) {
    console.error('Database connection test failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Connection failed';
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
