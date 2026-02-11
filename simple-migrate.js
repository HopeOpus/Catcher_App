#!/usr/bin/env node

/**
 * Simple migration script for Neon database
 * This script will create your database tables and seed the pre-registered properties
 */

const { Pool } = `require('pg')`;

// Get database URL from environment (set by set-env.js)
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found');
  console.log('Please run: node set-env.js');
  console.log('Then run: node simple-migrate.js');
  process.exit(1);
}

console.log('🚀 Starting simple database migration...');
console.log('📍 Database URL:', DATABASE_URL.replace(/:[^:]*@/, ':***@'));

// Database schema
const schema = `
  -- Create pre_registered_properties table
  CREATE TABLE IF NOT EXISTS pre_registered_properties (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Create users table
  CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Create properties table
  CREATE TABLE IF NOT EXISTS properties (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    serial_number VARCHAR(255) NOT NULL,
    description TEXT,
    date_registered DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Create property_photos table
  CREATE TABLE IF NOT EXISTS property_photos (
    id VARCHAR(255) PRIMARY KEY,
    property_id VARCHAR(255) REFERENCES properties(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(100),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Create indexes
  CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
  CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
  CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
  CREATE INDEX IF NOT EXISTS idx_property_photos_property_id ON property_photos(property_id);

  -- Create trigger function to update updated_at
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
  END;
  $$ language 'plpgsql';

  -- Create triggers
  DROP TRIGGER IF EXISTS update_pre_registered_properties_updated_at ON pre_registered_properties;
  CREATE TRIGGER update_pre_registered_properties_updated_at BEFORE UPDATE ON pre_registered_properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  DROP TRIGGER IF EXISTS update_users_updated_at ON users;
  CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
  CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

// Pre-registered properties data
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

async function migrate() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('📋 Creating database schema...');
    const client = await pool.connect();
    
    // Execute schema
    await client.query(schema);
    console.log('   ✅ Schema created');
    
    // Seed pre-registered properties
    console.log('🌱 Seeding pre-registered properties...');
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
    console.log('   ✅ Pre-registered properties seeded');
    
    client.release();
    await pool.end();
    
    console.log('🎉 Migration completed successfully!');
    console.log('');
    console.log('📊 Your database now contains:');
    console.log('   • pre_registered_properties table with 3 properties');
    console.log('   • users table for user management');
    console.log('   • properties table for user-registered items');
    console.log('   • property_photos table for image storage');
    console.log('');
    console.log('🔗 Next steps:');
    console.log('   1. Start your Next.js development server: npm run dev');
    console.log('   2. Visit http://localhost:3000/database-browser');
    console.log('   3. Test your connection and explore your data!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

migrate();