#!/usr/bin/env node

import "dotenv/config";
import pg from "pg";

const { Client } = pg;

const connectionString = process.env.DATABASE_URL?.replace(/^"|"$/g, "");

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

const schemaSql = `
DO $$ BEGIN
  CREATE TYPE property_type AS ENUM ('Vehicle', 'Electronics', 'Jewelry', 'Other');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE property_status AS ENUM ('Active', 'Flagged', 'Stolen');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_period AS ENUM ('monthly', 'yearly');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE stolen_report_status AS ENUM ('Reported', 'UnderInvestigation', 'Resolved');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

UPDATE users
SET created_at = CURRENT_TIMESTAMP
WHERE created_at IS NULL;

UPDATE users
SET updated_at = CURRENT_TIMESTAMP
WHERE updated_at IS NULL;

UPDATE pre_registered_properties
SET created_at = CURRENT_TIMESTAMP
WHERE created_at IS NULL;

UPDATE pre_registered_properties
SET updated_at = CURRENT_TIMESTAMP
WHERE updated_at IS NULL;

UPDATE pre_registered_properties
SET type = 'Other'
WHERE type IS NULL
   OR type NOT IN ('Vehicle', 'Electronics', 'Jewelry', 'Other');

UPDATE properties
SET created_at = CURRENT_TIMESTAMP
WHERE created_at IS NULL;

UPDATE properties
SET updated_at = CURRENT_TIMESTAMP
WHERE updated_at IS NULL;

UPDATE properties
SET status = 'Active'
WHERE status IS NULL
   OR status NOT IN ('Active', 'Flagged', 'Stolen');

UPDATE properties
SET type = 'Other'
WHERE type IS NULL
   OR type NOT IN ('Vehicle', 'Electronics', 'Jewelry', 'Other');

UPDATE property_photos
SET uploaded_at = CURRENT_TIMESTAMP
WHERE uploaded_at IS NULL;

ALTER TABLE users
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE pre_registered_properties
  ALTER COLUMN type DROP DEFAULT,
  ALTER COLUMN type TYPE property_type USING type::text::property_type,
  ALTER COLUMN type SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE properties
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN type DROP DEFAULT,
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN type TYPE property_type USING type::text::property_type,
  ALTER COLUMN type SET NOT NULL,
  ALTER COLUMN status TYPE property_status USING status::text::property_status,
  ALTER COLUMN status SET DEFAULT 'Active',
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE property_photos
  ALTER COLUMN property_id SET NOT NULL,
  ALTER COLUMN uploaded_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN uploaded_at SET NOT NULL;

CREATE TABLE IF NOT EXISTS subscriptions (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id VARCHAR(50) NOT NULL,
  plan_name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  period subscription_period NOT NULL,
  status subscription_status NOT NULL DEFAULT 'active',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stolen_reports (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id VARCHAR(255) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  property_name VARCHAR(255) NOT NULL,
  serial_number VARCHAR(255) NOT NULL,
  date_reported DATE NOT NULL DEFAULT CURRENT_DATE,
  location VARCHAR(500) NOT NULL,
  description TEXT,
  status stolen_report_status NOT NULL DEFAULT 'Reported',
  evidence_urls TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_serial_number ON properties(serial_number);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_property_photos_property_id ON property_photos(property_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_stolen_reports_user_id ON stolen_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_stolen_reports_property_id ON stolen_reports(property_id);
CREATE INDEX IF NOT EXISTS idx_stolen_reports_serial_number ON stolen_reports(serial_number);
CREATE INDEX IF NOT EXISTS idx_stolen_reports_status ON stolen_reports(status);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
CREATE TRIGGER update_properties_updated_at
BEFORE UPDATE ON properties
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pre_registered_properties_updated_at ON pre_registered_properties;
CREATE TRIGGER update_pre_registered_properties_updated_at
BEFORE UPDATE ON pre_registered_properties
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stolen_reports_updated_at ON stolen_reports;
CREATE TRIGGER update_stolen_reports_updated_at
BEFORE UPDATE ON stolen_reports
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

async function main() {
  await client.connect();

  try {
    await client.query("BEGIN");
    await client.query(schemaSql);
    await client.query("COMMIT");
    console.log("Remote schema synced successfully.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Remote schema sync failed:", error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

await main();
