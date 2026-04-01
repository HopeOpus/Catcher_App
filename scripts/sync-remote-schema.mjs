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
  CREATE TYPE user_role AS ENUM ('User', 'Admin');
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
  CREATE TYPE property_plan_code AS ENUM ('free', 'monthly', 'yearly');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE property_coverage_status AS ENUM ('scheduled', 'active', 'grace', 'archived', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_currency AS ENUM ('NGN');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_provider AS ENUM ('Paystack');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_event_source AS ENUM ('initialize', 'verify', 'webhook', 'callback', 'cancel');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE property_checkout_session_status AS ENUM (
    'draft',
    'pending_payment',
    'pending_verification',
    'completed',
    'expired',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE automation_email_status AS ENUM ('processing', 'sent', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_status AS ENUM ('unread', 'read', 'archived');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'PaymentReceived',
    'PaymentFailed',
    'CoverageExpiring',
    'GraceStarted',
    'PropertyArchived',
    'PropertyRestored',
    'StolenReportUpdated'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE audit_log_entity_type AS ENUM (
    'User',
    'Property',
    'StolenReport',
    'CatalogItem',
    'PropertyCoverage',
    'PaymentEvent'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE admin_note_target_type AS ENUM (
    'User',
    'Property',
    'StolenReport'
  );
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

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'User';

UPDATE users
SET role = 'User'
WHERE role IS NULL;

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

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS archive_reason VARCHAR(100);

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS restorable BOOLEAN DEFAULT FALSE;

UPDATE properties
SET restorable = FALSE
WHERE restorable IS NULL;

UPDATE property_photos
SET uploaded_at = CURRENT_TIMESTAMP
WHERE uploaded_at IS NULL;

ALTER TABLE users
  ALTER COLUMN role SET DEFAULT 'User',
  ALTER COLUMN role SET NOT NULL,
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
  ALTER COLUMN restorable SET DEFAULT FALSE,
  ALTER COLUMN restorable SET NOT NULL,
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

CREATE TABLE IF NOT EXISTS property_coverages (
  id VARCHAR(255) PRIMARY KEY,
  property_id VARCHAR(255) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_code property_plan_code NOT NULL,
  plan_name VARCHAR(100) NOT NULL,
  price_ngn_kobo INTEGER NOT NULL CHECK (price_ngn_kobo >= 0),
  currency payment_currency NOT NULL DEFAULT 'NGN',
  status property_coverage_status NOT NULL DEFAULT 'active',
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  grace_ends_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE,
  renewed_from_id VARCHAR(255) REFERENCES property_coverages(id) ON DELETE SET NULL,
  paystack_reference VARCHAR(255),
  paystack_customer_code VARCHAR(255),
  paystack_subscription_code VARCHAR(255),
  paystack_authorization_code VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS property_checkout_sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id VARCHAR(255) REFERENCES properties(id) ON DELETE SET NULL,
  coverage_id VARCHAR(255) REFERENCES property_coverages(id) ON DELETE SET NULL,
  return_path VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  type property_type NOT NULL,
  serial_number VARCHAR(255) NOT NULL,
  description TEXT,
  property_status property_status NOT NULL DEFAULT 'Active',
  date_registered DATE NOT NULL,
  cover_photo_url VARCHAR(500),
  photo_urls TEXT[] NOT NULL DEFAULT '{}',
  plan_code property_plan_code NOT NULL,
  plan_name VARCHAR(100) NOT NULL,
  price_ngn_kobo INTEGER NOT NULL CHECK (price_ngn_kobo >= 0),
  currency payment_currency NOT NULL DEFAULT 'NGN',
  status property_checkout_session_status NOT NULL DEFAULT 'draft',
  paystack_reference VARCHAR(255),
  paystack_customer_code VARCHAR(255),
  paystack_access_code VARCHAR(255),
  paystack_authorization_url VARCHAR(500),
  checkout_expires_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE property_checkout_sessions
  ADD COLUMN IF NOT EXISTS return_path VARCHAR(255);

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

CREATE TABLE IF NOT EXISTS automation_email_logs (
  id VARCHAR(255) PRIMARY KEY,
  dedupe_key VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  status automation_email_status NOT NULL DEFAULT 'processing',
  user_id VARCHAR(255),
  property_id VARCHAR(255),
  coverage_id VARCHAR(255),
  checkout_session_id VARCHAR(255),
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  resend_email_id VARCHAR(255),
  error_message TEXT,
  processing_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_event_logs (
  id VARCHAR(255) PRIMARY KEY,
  provider payment_provider NOT NULL DEFAULT 'Paystack',
  source payment_event_source NOT NULL,
  reference VARCHAR(255),
  provider_event_type VARCHAR(100),
  provider_transaction_id VARCHAR(100),
  provider_environment VARCHAR(50),
  checkout_session_id VARCHAR(255),
  user_id VARCHAR(255),
  property_id VARCHAR(255),
  coverage_id VARCHAR(255),
  amount_kobo INTEGER,
  currency payment_currency,
  transaction_status VARCHAR(100),
  signature_valid BOOLEAN,
  processing_outcome VARCHAR(100),
  error_message TEXT,
  payload JSONB,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link_path VARCHAR(255),
  status notification_status NOT NULL DEFAULT 'unread',
  read_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE,
  property_id VARCHAR(255) REFERENCES properties(id) ON DELETE CASCADE,
  coverage_id VARCHAR(255) REFERENCES property_coverages(id) ON DELETE SET NULL,
  stolen_report_id VARCHAR(255) REFERENCES stolen_reports(id) ON DELETE CASCADE,
  payment_event_log_id VARCHAR(255) REFERENCES payment_event_logs(id) ON DELETE SET NULL,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(255) PRIMARY KEY,
  actor_user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type audit_log_entity_type NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  entity_label VARCHAR(255),
  summary VARCHAR(255) NOT NULL,
  target_user_id VARCHAR(255),
  property_id VARCHAR(255) REFERENCES properties(id) ON DELETE CASCADE,
  stolen_report_id VARCHAR(255) REFERENCES stolen_reports(id) ON DELETE CASCADE,
  coverage_id VARCHAR(255) REFERENCES property_coverages(id) ON DELETE SET NULL,
  catalog_item_id VARCHAR(255),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_notes (
  id VARCHAR(255) PRIMARY KEY,
  author_user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type admin_note_target_type NOT NULL,
  target_id VARCHAR(255) NOT NULL,
  target_user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
  property_id VARCHAR(255) REFERENCES properties(id) ON DELETE CASCADE,
  stolen_report_id VARCHAR(255) REFERENCES stolen_reports(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS billing_receipts (
  id VARCHAR(255) PRIMARY KEY,
  receipt_number VARCHAR(100) NOT NULL,
  coverage_id VARCHAR(255) NOT NULL REFERENCES property_coverages(id) ON DELETE CASCADE,
  checkout_session_id VARCHAR(255) REFERENCES property_checkout_sessions(id) ON DELETE SET NULL,
  payment_event_log_id VARCHAR(255) REFERENCES payment_event_logs(id) ON DELETE SET NULL,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id VARCHAR(255) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  provider payment_provider NOT NULL DEFAULT 'Paystack',
  reference VARCHAR(255),
  plan_code property_plan_code NOT NULL,
  plan_name VARCHAR(100) NOT NULL,
  amount_kobo INTEGER NOT NULL CHECK (amount_kobo >= 0),
  currency payment_currency NOT NULL DEFAULT 'NGN',
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  snapshot JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS property_public_verifications (
  id VARCHAR(255) PRIMARY KEY,
  property_id VARCHAR(255) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  slug VARCHAR(100) NOT NULL,
  token VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  id VARCHAR(255) PRIMARY KEY,
  scope VARCHAR(100) NOT NULL,
  identifier VARCHAR(255) NOT NULL,
  window_started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  window_ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  hit_count INTEGER NOT NULL DEFAULT 1,
  blocked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_serial_number ON properties(serial_number);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_archived_at ON properties(archived_at);
CREATE INDEX IF NOT EXISTS idx_property_photos_property_id ON property_photos(property_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_property_coverages_property_id ON property_coverages(property_id);
CREATE INDEX IF NOT EXISTS idx_property_coverages_user_id ON property_coverages(user_id);
CREATE INDEX IF NOT EXISTS idx_property_coverages_status ON property_coverages(status);
CREATE INDEX IF NOT EXISTS idx_property_coverages_expires_at ON property_coverages(expires_at);
CREATE INDEX IF NOT EXISTS idx_property_coverages_grace_ends_at ON property_coverages(grace_ends_at);
CREATE INDEX IF NOT EXISTS idx_property_coverages_user_status ON property_coverages(user_id, status);
CREATE INDEX IF NOT EXISTS idx_property_coverages_property_status ON property_coverages(property_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_property_coverages_paystack_reference_unique
  ON property_coverages(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_property_checkout_sessions_user_id ON property_checkout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_property_checkout_sessions_property_id ON property_checkout_sessions(property_id);
CREATE INDEX IF NOT EXISTS idx_property_checkout_sessions_status ON property_checkout_sessions(status);
CREATE INDEX IF NOT EXISTS idx_property_checkout_sessions_checkout_expires_at
  ON property_checkout_sessions(checkout_expires_at);
CREATE INDEX IF NOT EXISTS idx_property_checkout_sessions_user_status
  ON property_checkout_sessions(user_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_property_checkout_sessions_coverage_id_unique
  ON property_checkout_sessions(coverage_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_property_checkout_sessions_paystack_reference_unique
  ON property_checkout_sessions(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_stolen_reports_user_id ON stolen_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_stolen_reports_property_id ON stolen_reports(property_id);
CREATE INDEX IF NOT EXISTS idx_stolen_reports_serial_number ON stolen_reports(serial_number);
CREATE INDEX IF NOT EXISTS idx_stolen_reports_status ON stolen_reports(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_automation_email_logs_dedupe_key_unique
  ON automation_email_logs(dedupe_key);
CREATE INDEX IF NOT EXISTS idx_automation_email_logs_event_type
  ON automation_email_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_automation_email_logs_status
  ON automation_email_logs(status);
CREATE INDEX IF NOT EXISTS idx_automation_email_logs_user_id
  ON automation_email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_email_logs_property_id
  ON automation_email_logs(property_id);
CREATE INDEX IF NOT EXISTS idx_automation_email_logs_coverage_id
  ON automation_email_logs(coverage_id);
CREATE INDEX IF NOT EXISTS idx_payment_event_logs_provider
  ON payment_event_logs(provider);
CREATE INDEX IF NOT EXISTS idx_payment_event_logs_source
  ON payment_event_logs(source);
CREATE INDEX IF NOT EXISTS idx_payment_event_logs_reference
  ON payment_event_logs(reference);
CREATE INDEX IF NOT EXISTS idx_payment_event_logs_checkout_session_id
  ON payment_event_logs(checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_payment_event_logs_user_id
  ON payment_event_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_event_logs_property_id
  ON payment_event_logs(property_id);
CREATE INDEX IF NOT EXISTS idx_payment_event_logs_coverage_id
  ON payment_event_logs(coverage_id);
CREATE INDEX IF NOT EXISTS idx_payment_event_logs_processing_outcome
  ON payment_event_logs(processing_outcome);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status
  ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_type
  ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_property_id
  ON notifications(property_id);
CREATE INDEX IF NOT EXISTS idx_notifications_coverage_id
  ON notifications(coverage_id);
CREATE INDEX IF NOT EXISTS idx_notifications_stolen_report_id
  ON notifications(stolen_report_id);
CREATE INDEX IF NOT EXISTS idx_notifications_payment_event_log_id
  ON notifications(payment_event_log_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_status_created_at
  ON notifications(user_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_user_id
  ON audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type
  ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id
  ON audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_user_id
  ON audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_property_id
  ON audit_logs(property_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_stolen_report_id
  ON audit_logs(stolen_report_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_coverage_id
  ON audit_logs(coverage_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_notes_author_user_id
  ON admin_notes(author_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_notes_target_type
  ON admin_notes(target_type);
CREATE INDEX IF NOT EXISTS idx_admin_notes_target_id
  ON admin_notes(target_id);
CREATE INDEX IF NOT EXISTS idx_admin_notes_target_user_id
  ON admin_notes(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_notes_property_id
  ON admin_notes(property_id);
CREATE INDEX IF NOT EXISTS idx_admin_notes_stolen_report_id
  ON admin_notes(stolen_report_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_receipts_receipt_number_unique
  ON billing_receipts(receipt_number);
CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_receipts_coverage_id_unique
  ON billing_receipts(coverage_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_receipts_checkout_session_id_unique
  ON billing_receipts(checkout_session_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_receipts_payment_event_log_id_unique
  ON billing_receipts(payment_event_log_id);
CREATE INDEX IF NOT EXISTS idx_billing_receipts_user_id
  ON billing_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_receipts_property_id
  ON billing_receipts(property_id);
CREATE INDEX IF NOT EXISTS idx_billing_receipts_reference
  ON billing_receipts(reference);
CREATE UNIQUE INDEX IF NOT EXISTS idx_property_public_verifications_property_id_unique
  ON property_public_verifications(property_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_property_public_verifications_slug_unique
  ON property_public_verifications(slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_property_public_verifications_token_unique
  ON property_public_verifications(token);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limit_buckets_scope_identifier_window_unique
  ON rate_limit_buckets(scope, identifier, window_started_at);
CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_scope_identifier
  ON rate_limit_buckets(scope, identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_blocked_until
  ON rate_limit_buckets(blocked_until);

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

DROP TRIGGER IF EXISTS update_property_coverages_updated_at ON property_coverages;
CREATE TRIGGER update_property_coverages_updated_at
BEFORE UPDATE ON property_coverages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_property_checkout_sessions_updated_at ON property_checkout_sessions;
CREATE TRIGGER update_property_checkout_sessions_updated_at
BEFORE UPDATE ON property_checkout_sessions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stolen_reports_updated_at ON stolen_reports;
CREATE TRIGGER update_stolen_reports_updated_at
BEFORE UPDATE ON stolen_reports
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_automation_email_logs_updated_at ON automation_email_logs;
CREATE TRIGGER update_automation_email_logs_updated_at
BEFORE UPDATE ON automation_email_logs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_event_logs_updated_at ON payment_event_logs;
CREATE TRIGGER update_payment_event_logs_updated_at
BEFORE UPDATE ON payment_event_logs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON notifications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_notes_updated_at ON admin_notes;
CREATE TRIGGER update_admin_notes_updated_at
BEFORE UPDATE ON admin_notes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_billing_receipts_updated_at ON billing_receipts;
CREATE TRIGGER update_billing_receipts_updated_at
BEFORE UPDATE ON billing_receipts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_property_public_verifications_updated_at ON property_public_verifications;
CREATE TRIGGER update_property_public_verifications_updated_at
BEFORE UPDATE ON property_public_verifications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rate_limit_buckets_updated_at ON rate_limit_buckets;
CREATE TRIGGER update_rate_limit_buckets_updated_at
BEFORE UPDATE ON rate_limit_buckets
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
