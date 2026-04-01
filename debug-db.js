#!/usr/bin/env node

/**
 * Debug script to test database connection
 */

require('dotenv').config();
const pg = require('pg');

console.log('🔍 Debugging database connection...');
console.log('DATABASE_URL from environment:', process.env.DATABASE_URL);

// Test if .env.local is being loaded
const fs = require('fs');
if (fs.existsSync('.env.local')) {
  console.log('✅ .env.local file exists');
  const envContent = fs.readFileSync('.env.local', 'utf8');
  console.log('Contents of .env.local:');
  console.log(envContent);
} else {
  console.log('❌ .env.local file not found');
}

// Try to connect with the DATABASE_URL
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
};

console.log('Database config:', dbConfig);

async function testConnection() {
  try {
    const pool = new pg.Pool(dbConfig);
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connection successful!');
    console.log('Current time:', result.rows[0].now);
    await pool.end();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Error details:', error);
  }
}

testConnection();
