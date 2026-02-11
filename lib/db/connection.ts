import { Pool } from 'pg';


// Database connection configuration for Neon
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Neon SSL connections
  }
};

// Create connection pool
export const pool = new Pool(dbConfig);

// Test database connection
export async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('Database connection successful:', result.rows[0]);
    return true;
  } catch (err) {
    console.error('Database connection failed:', err);
    return false;
  }
}

// Initialize database - run schema and seed data
export async function initializeDatabase() {
  try {
    // Read schema from file
    const schema = await import('./schema.sql');
    
    const client = await pool.connect();
    await client.query(schema.default || schema);
    client.release();
    
    // Seed pre-registered properties
    await seedPreRegisteredProperties();
    
    console.log('Database initialized successfully');
    return true;
  } catch (err) {
    console.error('Database initialization failed:', err);
    return false;
  }
}

// Seed pre-registered properties with the existing mock data
async function seedPreRegisteredProperties() {
  const preRegisteredProperties = [
    {
      id: 'vehicle-1',
      name: '2023 Toyota Camry',
      type: 'Vehicle',
      description: 'Black sedan with leather interior',
      image_url: '/placeholder-property.jpg'
    },
    {
      id: 'electronics-1',
      name: 'iPhone 15 Pro',
      type: 'Electronics',
      description: '128GB, Natural Titanium',
      image_url: '/placeholder-electronics.jpg'
    },
    {
      id: 'jewelry-1',
      name: 'Rolex Submariner',
      type: 'Jewelry',
      description: 'Stainless steel with black dial',
      image_url: '/placeholder-jewelry.jpg'
    }
  ];

  const client = await pool.connect();
  
  try {
    for (const prop of preRegisteredProperties) {
      await client.query(
        `INSERT INTO pre_registered_properties (id, name, type, description, image_url)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           type = EXCLUDED.type,
           description = EXCLUDED.description,
           image_url = EXCLUDED.image_url`,
        [prop.id, prop.name, prop.type, prop.description, prop.image_url]
      );
    }
    console.log('Pre-registered properties seeded successfully');
  } finally {
    client.release();
  }
}

// Export database utilities
export { pool as db };
