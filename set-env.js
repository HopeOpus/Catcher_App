#!/usr/bin/env node

/**
 * Simple script to set environment variables from .env.local
 */

const fs = require('fs');

// Read .env.local file
const envContent = fs.readFileSync('.env.local', 'utf8');
const lines = envContent.split('\n');

// Parse and set environment variables
lines.forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=');
    process.env[key] = value;
    console.log(`Set ${key}=${value.substring(0, 20)}...`);
  }
});

console.log('✅ Environment variables loaded');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Found' : 'Not found');
