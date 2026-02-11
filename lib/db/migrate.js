#!/usr/bin/env node

/**
 * Database migration script for Catcher application
 * Run this script to set up the database schema and seed data
 */

require('dotenv').config();
const pg = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Neon SSL connections
  }
};

async function migrate() {
  console.log('🚀 Starting database migration...');
  
  const pool = new pg.Pool(dbConfig);
  
  try {
    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📋 Executing schema...');
    const client = await pool.connect();
    await client.query(schema);
    client.release();
    
    // Seed pre-registered properties
    console.log('🌱 Seeding pre-registered properties...');
    await seedPreRegisteredProperties(pool);
    
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function seedPreRegisteredProperties(pool) {
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
    console.log('   ✅ Pre-registered properties seeded');
  } finally {
    client.release();
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrate();
}

module.exports = { migrate, seedPreRegisteredProperties };
