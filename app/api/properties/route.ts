import { NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';

// GET - Fetch all properties or filter by user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    // First check if photo_url column exists
    const client = await db.connect();
    let query = 'SELECT id, user_id, name, type, serial_number, description, date_registered, status, created_at, updated_at';
    
    try {
      const columnCheck = await client.query(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_name = 'properties' AND column_name = 'photo_url'`
      );
      if (columnCheck.rows.length > 0) {
        query = 'SELECT * FROM properties';
      }
    } catch {
      // Column doesn't exist, use basic query
    }
    
    let params: string[] = [];
    
    if (userId) {
      query += ' WHERE user_id = $1';
      params = [userId];
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await client.query(query, params);
    client.release();
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching properties:', error);
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
  }
}


// POST - Create a new property
export async function POST(request: Request) {
  const client = await db.connect();
  try {
    const body = await request.json();
    const { user_id, name, type, serial_number, description, status, photo_url } = body;
    
    const id = Math.random().toString(36).substring(2, 11);
    
    // Check if user exists, if not create a default user
    const finalUserId = user_id || 'default-user';

    const userCheck = await client.query('SELECT id FROM users WHERE id = $1', [finalUserId]);
    
    if (userCheck.rows.length === 0) {
      // Create default user
      await client.query(
        `INSERT INTO users (id, email, name, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         ON CONFLICT (id) DO NOTHING`,
        [finalUserId, 'default@catcher.com', 'Default User']
      );
    }
    
    // Check if photo_url column exists
    const columnCheck = await client.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'properties' AND column_name = 'photo_url'`
    );
    
    let result;
    if (columnCheck.rows.length > 0 && photo_url) {
      // Column exists and we have a photo URL
      result = await client.query(
        `INSERT INTO properties (id, user_id, name, type, serial_number, description, date_registered, status, photo_url, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8, NOW(), NOW())
         RETURNING *`,
        [id, finalUserId, name, type, serial_number, description, status || 'Active', photo_url]
      );
    } else {
      // Column doesn't exist or no photo URL
      result = await client.query(
        `INSERT INTO properties (id, user_id, name, type, serial_number, description, date_registered, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, NOW(), NOW())
         RETURNING *`,
        [id, finalUserId, name, type, serial_number, description, status || 'Active']
      );
    }
    
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating property:', error);
    return NextResponse.json({ error: 'Failed to create property' }, { status: 500 });
  } finally {
    client.release();
  }
}

// DELETE - Delete a property
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }
    
    const client = await db.connect();
    const result = await client.query('DELETE FROM properties WHERE id = $1 RETURNING *', [id]);
    client.release();
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Error deleting property:', error);
    return NextResponse.json({ error: 'Failed to delete property' }, { status: 500 });
  }
}


