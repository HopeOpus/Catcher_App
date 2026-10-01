-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "property_type" AS ENUM ('Vehicle', 'Electronics', 'Jewelry', 'Document', 'Other');

-- CreateEnum
CREATE TYPE "property_status" AS ENUM ('Active', 'Flagged', 'Stolen');

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('User', 'Admin');

-- CreateEnum
CREATE TYPE "subscription_period" AS ENUM ('monthly', 'yearly');

-- CreateEnum
CREATE TYPE "subscription_status" AS ENUM ('active', 'cancelled', 'expired');

-- CreateEnum
CREATE TYPE "property_plan_code" AS ENUM ('free', 'monthly', 'yearly');

-- CreateEnum
CREATE TYPE "property_coverage_status" AS ENUM ('scheduled', 'active', 'grace', 'archived', 'cancelled');

-- CreateEnum
CREATE TYPE "payment_currency" AS ENUM ('USD', 'NGN');

-- CreateEnum
CREATE TYPE "payment_provider" AS ENUM ('Paystack');

-- CreateEnum
CREATE TYPE "payment_event_source" AS ENUM ('initialize', 'verify', 'webhook', 'callback', 'cancel');

-- CreateEnum
CREATE TYPE "property_checkout_session_status" AS ENUM ('draft', 'pending_payment', 'pending_verification', 'completed', 'expired', 'cancelled');

-- CreateEnum
CREATE TYPE "automation_email_status" AS ENUM ('processing', 'sent', 'failed');

-- CreateEnum
CREATE TYPE "notification_status" AS ENUM ('unread', 'read', 'archived');

-- CreateEnum
CREATE TYPE "notification_type" AS ENUM ('PaymentReceived', 'PaymentFailed', 'CoverageExpiring', 'GraceStarted', 'PropertyArchived', 'PropertyRestored', 'StolenReportUpdated', 'ReferralSignupDetected', 'ReferralSuccessful', 'ReferralMilestoneReached', 'CreditsReceived', 'CreditsTransferred', 'CreditsExpiringSoon', 'CreditsExpired', 'AmbassadorBadgeEarned');

-- CreateEnum
CREATE TYPE "audit_log_entity_type" AS ENUM ('User', 'Property', 'StolenReport', 'CatalogItem', 'PropertyCoverage', 'PaymentEvent', 'WalletTransaction', 'ReferralProfile', 'ReferralRelationship', 'PromotionCampaign');

-- CreateEnum
CREATE TYPE "admin_note_target_type" AS ENUM ('User', 'Property', 'StolenReport');

-- CreateEnum
CREATE TYPE "stolen_report_status" AS ENUM ('Reported', 'UnderInvestigation', 'Resolved');

-- CreateEnum
CREATE TYPE "wallet_transaction_type" AS ENUM ('referral_bonus', 'milestone_bonus', 'promotion_bonus', 'gift_received', 'gift_sent', 'registration_spend', 'premium_feature_spend', 'theft_alert_boost_spend', 'expiry_debit', 'admin_adjustment', 'manual_grant', 'manual_reversal', 'transfer_reversal', 'registration_refund');

-- CreateEnum
CREATE TYPE "wallet_transaction_direction" AS ENUM ('credit', 'debit');

-- CreateEnum
CREATE TYPE "referral_relationship_status" AS ENUM ('attached', 'qualified', 'rewarded', 'rejected');

-- CreateEnum
CREATE TYPE "referral_fraud_review_status" AS ENUM ('clear', 'flagged', 'blocked');

-- CreateEnum
CREATE TYPE "promotion_campaign_status" AS ENUM ('draft', 'active', 'expired', 'cancelled');

-- CreateEnum
CREATE TYPE "promotion_reward_type" AS ENUM ('fixed_credits');

-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'User',
    "profile_image_url" VARCHAR(500),
    "nin" VARCHAR(50),
    "phone_number" VARCHAR(50),
    "next_of_kin_name" VARCHAR(255),
    "next_of_kin_email" VARCHAR(255),
    "next_of_kin_phone" VARCHAR(50),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" VARCHAR(255) NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" "property_type" NOT NULL,
    "serial_number" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "date_registered" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "property_status" NOT NULL DEFAULT 'Active',
    "photo_url" VARCHAR(500),
    "archived_at" TIMESTAMPTZ,
    "archive_reason" VARCHAR(100),
    "restorable" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_photos" (
    "id" VARCHAR(255) NOT NULL,
    "property_id" VARCHAR(255) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_url" VARCHAR(500) NOT NULL,
    "cloudinary_public_id" VARCHAR(255),
    "file_size" INTEGER,
    "file_type" VARCHAR(100),
    "uploaded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pre_registered_properties" (
    "id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" "property_type" NOT NULL,
    "description" TEXT,
    "image_url" VARCHAR(500),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pre_registered_properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" VARCHAR(255) NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "plan_id" VARCHAR(50) NOT NULL,
    "plan_name" VARCHAR(100) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "period" "subscription_period" NOT NULL,
    "status" "subscription_status" NOT NULL DEFAULT 'active',
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_coverages" (
    "id" VARCHAR(255) NOT NULL,
    "property_id" VARCHAR(255) NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "plan_code" "property_plan_code" NOT NULL,
    "plan_name" VARCHAR(100) NOT NULL,
    "price_ngn_kobo" INTEGER NOT NULL,
    "currency" "payment_currency" NOT NULL DEFAULT 'NGN',
    "status" "property_coverage_status" NOT NULL DEFAULT 'active',
    "starts_at" TIMESTAMPTZ NOT NULL,
    "expires_at" TIMESTAMPTZ,
    "grace_ends_at" TIMESTAMPTZ,
    "archived_at" TIMESTAMPTZ,
    "renewed_from_id" VARCHAR(255),
    "paystack_reference" VARCHAR(255),
    "paystack_customer_code" VARCHAR(255),
    "paystack_subscription_code" VARCHAR(255),
    "paystack_authorization_code" VARCHAR(255),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_coverages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_checkout_sessions" (
    "id" VARCHAR(255) NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "property_id" VARCHAR(255),
    "coverage_id" VARCHAR(255),
    "return_path" VARCHAR(255),
    "name" VARCHAR(255) NOT NULL,
    "type" "property_type" NOT NULL,
    "serial_number" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "property_status" "property_status" NOT NULL DEFAULT 'Active',
    "date_registered" DATE NOT NULL,
    "cover_photo_url" VARCHAR(500),
    "photo_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "plan_code" "property_plan_code" NOT NULL,
    "plan_name" VARCHAR(100) NOT NULL,
    "price_ngn_kobo" INTEGER NOT NULL,
    "currency" "payment_currency" NOT NULL DEFAULT 'NGN',
    "status" "property_checkout_session_status" NOT NULL DEFAULT 'draft',
    "paystack_reference" VARCHAR(255),
    "paystack_customer_code" VARCHAR(255),
    "paystack_access_code" VARCHAR(255),
    "paystack_authorization_url" VARCHAR(500),
    "checkout_expires_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_checkout_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stolen_reports" (
    "id" VARCHAR(255) NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "property_id" VARCHAR(255) NOT NULL,
    "property_name" VARCHAR(255) NOT NULL,
    "serial_number" VARCHAR(255) NOT NULL,
    "date_reported" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "status" "stolen_report_status" NOT NULL DEFAULT 'Reported',
    "evidence_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stolen_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_email_logs" (
    "id" VARCHAR(255) NOT NULL,
    "dedupe_key" VARCHAR(255) NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "status" "automation_email_status" NOT NULL DEFAULT 'processing',
    "user_id" VARCHAR(255),
    "property_id" VARCHAR(255),
    "coverage_id" VARCHAR(255),
    "checkout_session_id" VARCHAR(255),
    "recipient_email" VARCHAR(255) NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "resend_email_id" VARCHAR(255),
    "error_message" TEXT,
    "processing_started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMPTZ,
    "failed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automation_email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_event_logs" (
    "id" VARCHAR(255) NOT NULL,
    "provider" "payment_provider" NOT NULL DEFAULT 'Paystack',
    "source" "payment_event_source" NOT NULL,
    "reference" VARCHAR(255),
    "provider_event_type" VARCHAR(100),
    "provider_transaction_id" VARCHAR(100),
    "provider_environment" VARCHAR(50),
    "checkout_session_id" VARCHAR(255),
    "user_id" VARCHAR(255),
    "property_id" VARCHAR(255),
    "coverage_id" VARCHAR(255),
    "amount_kobo" INTEGER,
    "currency" "payment_currency",
    "transaction_status" VARCHAR(100),
    "signature_valid" BOOLEAN,
    "processing_outcome" VARCHAR(100),
    "error_message" TEXT,
    "payload" JSONB,
    "processed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_event_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" VARCHAR(255) NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "type" "notification_type" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "link_path" VARCHAR(255),
    "status" "notification_status" NOT NULL DEFAULT 'unread',
    "read_at" TIMESTAMPTZ,
    "archived_at" TIMESTAMPTZ,
    "property_id" VARCHAR(255),
    "coverage_id" VARCHAR(255),
    "stolen_report_id" VARCHAR(255),
    "payment_event_log_id" VARCHAR(255),
    "payload" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" VARCHAR(255) NOT NULL,
    "actor_user_id" VARCHAR(255),
    "action" VARCHAR(100) NOT NULL,
    "entity_type" "audit_log_entity_type" NOT NULL,
    "entity_id" VARCHAR(255) NOT NULL,
    "entity_label" VARCHAR(255),
    "summary" VARCHAR(255) NOT NULL,
    "target_user_id" VARCHAR(255),
    "property_id" VARCHAR(255),
    "stolen_report_id" VARCHAR(255),
    "coverage_id" VARCHAR(255),
    "catalog_item_id" VARCHAR(255),
    "details" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_notes" (
    "id" VARCHAR(255) NOT NULL,
    "author_user_id" VARCHAR(255) NOT NULL,
    "target_type" "admin_note_target_type" NOT NULL,
    "target_id" VARCHAR(255) NOT NULL,
    "target_user_id" VARCHAR(255),
    "property_id" VARCHAR(255),
    "stolen_report_id" VARCHAR(255),
    "body" TEXT NOT NULL,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_receipts" (
    "id" VARCHAR(255) NOT NULL,
    "receipt_number" VARCHAR(100) NOT NULL,
    "coverage_id" VARCHAR(255) NOT NULL,
    "checkout_session_id" VARCHAR(255),
    "payment_event_log_id" VARCHAR(255),
    "user_id" VARCHAR(255) NOT NULL,
    "property_id" VARCHAR(255) NOT NULL,
    "provider" "payment_provider" NOT NULL DEFAULT 'Paystack',
    "reference" VARCHAR(255),
    "plan_code" "property_plan_code" NOT NULL,
    "plan_name" VARCHAR(100) NOT NULL,
    "amount_kobo" INTEGER NOT NULL,
    "currency" "payment_currency" NOT NULL DEFAULT 'NGN',
    "starts_at" TIMESTAMPTZ NOT NULL,
    "expires_at" TIMESTAMPTZ,
    "issued_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "snapshot" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_public_verifications" (
    "id" VARCHAR(255) NOT NULL,
    "property_id" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_public_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" VARCHAR(255) NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "balance_credits" INTEGER NOT NULL DEFAULT 0,
    "lifetime_earned_credits" INTEGER NOT NULL DEFAULT 0,
    "lifetime_spent_credits" INTEGER NOT NULL DEFAULT 0,
    "lifetime_expired_credits" INTEGER NOT NULL DEFAULT 0,
    "lifetime_transferred_in_credits" INTEGER NOT NULL DEFAULT 0,
    "lifetime_transferred_out_credits" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" VARCHAR(255) NOT NULL,
    "wallet_id" VARCHAR(255) NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "type" "wallet_transaction_type" NOT NULL,
    "direction" "wallet_transaction_direction" NOT NULL,
    "amount_credits" INTEGER NOT NULL,
    "balance_after_credits" INTEGER NOT NULL,
    "description" VARCHAR(255),
    "reference_type" VARCHAR(100),
    "reference_id" VARCHAR(255),
    "expires_at" TIMESTAMPTZ,
    "expired_from_transaction_id" VARCHAR(255),
    "promotion_campaign_id" VARCHAR(255),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_profiles" (
    "id" VARCHAR(255) NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "referral_code" VARCHAR(50) NOT NULL,
    "qualified_referral_count" INTEGER NOT NULL DEFAULT 0,
    "milestone_5_awarded_at" TIMESTAMPTZ,
    "milestone_20_awarded_at" TIMESTAMPTZ,
    "milestone_100_awarded_at" TIMESTAMPTZ,
    "ambassador_badge_awarded_at" TIMESTAMPTZ,
    "is_disabled" BOOLEAN NOT NULL DEFAULT false,
    "disabled_at" TIMESTAMPTZ,
    "disabled_reason" VARCHAR(255),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_relationships" (
    "id" VARCHAR(255) NOT NULL,
    "referral_profile_id" VARCHAR(255) NOT NULL,
    "referrer_user_id" VARCHAR(255) NOT NULL,
    "referred_user_id" VARCHAR(255) NOT NULL,
    "referral_code_used" VARCHAR(50) NOT NULL,
    "status" "referral_relationship_status" NOT NULL DEFAULT 'attached',
    "fraud_review_status" "referral_fraud_review_status" NOT NULL DEFAULT 'clear',
    "fraud_review_reason" VARCHAR(255),
    "attach_device_install_id" VARCHAR(255),
    "attached_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "qualified_at" TIMESTAMPTZ,
    "rewarded_at" TIMESTAMPTZ,
    "qualification_checkout_session_id" VARCHAR(255),
    "qualification_coverage_id" VARCHAR(255),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_campaigns" (
    "id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "code" VARCHAR(50),
    "status" "promotion_campaign_status" NOT NULL DEFAULT 'draft',
    "reward_type" "promotion_reward_type" NOT NULL DEFAULT 'fixed_credits',
    "reward_credits" INTEGER NOT NULL DEFAULT 0,
    "starts_at" TIMESTAMPTZ,
    "ends_at" TIMESTAMPTZ,
    "max_redemptions" INTEGER,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit_buckets" (
    "id" VARCHAR(255) NOT NULL,
    "scope" VARCHAR(100) NOT NULL,
    "identifier" VARCHAR(255) NOT NULL,
    "window_started_at" TIMESTAMPTZ NOT NULL,
    "window_ends_at" TIMESTAMPTZ NOT NULL,
    "hit_count" INTEGER NOT NULL DEFAULT 1,
    "blocked_until" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "properties_user_id_idx" ON "properties"("user_id");

-- CreateIndex
CREATE INDEX "properties_serial_number_idx" ON "properties"("serial_number");

-- CreateIndex
CREATE INDEX "properties_type_idx" ON "properties"("type");

-- CreateIndex
CREATE INDEX "properties_status_idx" ON "properties"("status");

-- CreateIndex
CREATE INDEX "properties_archived_at_idx" ON "properties"("archived_at");

-- CreateIndex
CREATE INDEX "property_photos_property_id_idx" ON "property_photos"("property_id");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "property_coverages_paystack_reference_key" ON "property_coverages"("paystack_reference");

-- CreateIndex
CREATE INDEX "property_coverages_property_id_idx" ON "property_coverages"("property_id");

-- CreateIndex
CREATE INDEX "property_coverages_user_id_idx" ON "property_coverages"("user_id");

-- CreateIndex
CREATE INDEX "property_coverages_status_idx" ON "property_coverages"("status");

-- CreateIndex
CREATE INDEX "property_coverages_expires_at_idx" ON "property_coverages"("expires_at");

-- CreateIndex
CREATE INDEX "property_coverages_grace_ends_at_idx" ON "property_coverages"("grace_ends_at");

-- CreateIndex
CREATE INDEX "property_coverages_user_id_status_idx" ON "property_coverages"("user_id", "status");

-- CreateIndex
CREATE INDEX "property_coverages_property_id_status_idx" ON "property_coverages"("property_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "property_checkout_sessions_coverage_id_key" ON "property_checkout_sessions"("coverage_id");

-- CreateIndex
CREATE UNIQUE INDEX "property_checkout_sessions_paystack_reference_key" ON "property_checkout_sessions"("paystack_reference");

-- CreateIndex
CREATE INDEX "property_checkout_sessions_user_id_idx" ON "property_checkout_sessions"("user_id");

-- CreateIndex
CREATE INDEX "property_checkout_sessions_property_id_idx" ON "property_checkout_sessions"("property_id");

-- CreateIndex
CREATE INDEX "property_checkout_sessions_status_idx" ON "property_checkout_sessions"("status");

-- CreateIndex
CREATE INDEX "property_checkout_sessions_checkout_expires_at_idx" ON "property_checkout_sessions"("checkout_expires_at");

-- CreateIndex
CREATE INDEX "property_checkout_sessions_user_id_status_idx" ON "property_checkout_sessions"("user_id", "status");

-- CreateIndex
CREATE INDEX "stolen_reports_user_id_idx" ON "stolen_reports"("user_id");

-- CreateIndex
CREATE INDEX "stolen_reports_property_id_idx" ON "stolen_reports"("property_id");

-- CreateIndex
CREATE INDEX "stolen_reports_serial_number_idx" ON "stolen_reports"("serial_number");

-- CreateIndex
CREATE INDEX "stolen_reports_status_idx" ON "stolen_reports"("status");

-- CreateIndex
CREATE UNIQUE INDEX "automation_email_logs_dedupe_key_key" ON "automation_email_logs"("dedupe_key");

-- CreateIndex
CREATE INDEX "automation_email_logs_event_type_idx" ON "automation_email_logs"("event_type");

-- CreateIndex
CREATE INDEX "automation_email_logs_status_idx" ON "automation_email_logs"("status");

-- CreateIndex
CREATE INDEX "automation_email_logs_user_id_idx" ON "automation_email_logs"("user_id");

-- CreateIndex
CREATE INDEX "automation_email_logs_property_id_idx" ON "automation_email_logs"("property_id");

-- CreateIndex
CREATE INDEX "automation_email_logs_coverage_id_idx" ON "automation_email_logs"("coverage_id");

-- CreateIndex
CREATE INDEX "payment_event_logs_provider_idx" ON "payment_event_logs"("provider");

-- CreateIndex
CREATE INDEX "payment_event_logs_source_idx" ON "payment_event_logs"("source");

-- CreateIndex
CREATE INDEX "payment_event_logs_reference_idx" ON "payment_event_logs"("reference");

-- CreateIndex
CREATE INDEX "payment_event_logs_checkout_session_id_idx" ON "payment_event_logs"("checkout_session_id");

-- CreateIndex
CREATE INDEX "payment_event_logs_user_id_idx" ON "payment_event_logs"("user_id");

-- CreateIndex
CREATE INDEX "payment_event_logs_property_id_idx" ON "payment_event_logs"("property_id");

-- CreateIndex
CREATE INDEX "payment_event_logs_coverage_id_idx" ON "payment_event_logs"("coverage_id");

-- CreateIndex
CREATE INDEX "payment_event_logs_processing_outcome_idx" ON "payment_event_logs"("processing_outcome");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "notifications"("status");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_property_id_idx" ON "notifications"("property_id");

-- CreateIndex
CREATE INDEX "notifications_coverage_id_idx" ON "notifications"("coverage_id");

-- CreateIndex
CREATE INDEX "notifications_stolen_report_id_idx" ON "notifications"("stolen_report_id");

-- CreateIndex
CREATE INDEX "notifications_payment_event_log_id_idx" ON "notifications"("payment_event_log_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_status_created_at_idx" ON "notifications"("user_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_idx" ON "audit_logs"("actor_user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_idx" ON "audit_logs"("entity_type");

-- CreateIndex
CREATE INDEX "audit_logs_entity_id_idx" ON "audit_logs"("entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_target_user_id_idx" ON "audit_logs"("target_user_id");

-- CreateIndex
CREATE INDEX "audit_logs_property_id_idx" ON "audit_logs"("property_id");

-- CreateIndex
CREATE INDEX "audit_logs_stolen_report_id_idx" ON "audit_logs"("stolen_report_id");

-- CreateIndex
CREATE INDEX "audit_logs_coverage_id_idx" ON "audit_logs"("coverage_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "admin_notes_author_user_id_idx" ON "admin_notes"("author_user_id");

-- CreateIndex
CREATE INDEX "admin_notes_target_type_idx" ON "admin_notes"("target_type");

-- CreateIndex
CREATE INDEX "admin_notes_target_id_idx" ON "admin_notes"("target_id");

-- CreateIndex
CREATE INDEX "admin_notes_target_user_id_idx" ON "admin_notes"("target_user_id");

-- CreateIndex
CREATE INDEX "admin_notes_property_id_idx" ON "admin_notes"("property_id");

-- CreateIndex
CREATE INDEX "admin_notes_stolen_report_id_idx" ON "admin_notes"("stolen_report_id");

-- CreateIndex
CREATE UNIQUE INDEX "billing_receipts_receipt_number_key" ON "billing_receipts"("receipt_number");

-- CreateIndex
CREATE UNIQUE INDEX "billing_receipts_coverage_id_key" ON "billing_receipts"("coverage_id");

-- CreateIndex
CREATE UNIQUE INDEX "billing_receipts_checkout_session_id_key" ON "billing_receipts"("checkout_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "billing_receipts_payment_event_log_id_key" ON "billing_receipts"("payment_event_log_id");

-- CreateIndex
CREATE INDEX "billing_receipts_user_id_idx" ON "billing_receipts"("user_id");

-- CreateIndex
CREATE INDEX "billing_receipts_property_id_idx" ON "billing_receipts"("property_id");

-- CreateIndex
CREATE INDEX "billing_receipts_reference_idx" ON "billing_receipts"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "property_public_verifications_property_id_key" ON "property_public_verifications"("property_id");

-- CreateIndex
CREATE UNIQUE INDEX "property_public_verifications_slug_key" ON "property_public_verifications"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "property_public_verifications_token_key" ON "property_public_verifications"("token");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_user_id_key" ON "wallets"("user_id");

-- CreateIndex
CREATE INDEX "wallet_transactions_wallet_id_created_at_idx" ON "wallet_transactions"("wallet_id", "created_at");

-- CreateIndex
CREATE INDEX "wallet_transactions_user_id_created_at_idx" ON "wallet_transactions"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "wallet_transactions_type_idx" ON "wallet_transactions"("type");

-- CreateIndex
CREATE INDEX "wallet_transactions_reference_type_reference_id_idx" ON "wallet_transactions"("reference_type", "reference_id");

-- CreateIndex
CREATE INDEX "wallet_transactions_expires_at_idx" ON "wallet_transactions"("expires_at");

-- CreateIndex
CREATE INDEX "wallet_transactions_promotion_campaign_id_idx" ON "wallet_transactions"("promotion_campaign_id");

-- CreateIndex
CREATE UNIQUE INDEX "referral_profiles_user_id_key" ON "referral_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "referral_profiles_referral_code_key" ON "referral_profiles"("referral_code");

-- CreateIndex
CREATE INDEX "referral_profiles_is_disabled_idx" ON "referral_profiles"("is_disabled");

-- CreateIndex
CREATE UNIQUE INDEX "referral_relationships_referred_user_id_key" ON "referral_relationships"("referred_user_id");

-- CreateIndex
CREATE INDEX "referral_relationships_referral_profile_id_idx" ON "referral_relationships"("referral_profile_id");

-- CreateIndex
CREATE INDEX "referral_relationships_referrer_user_id_idx" ON "referral_relationships"("referrer_user_id");

-- CreateIndex
CREATE INDEX "referral_relationships_status_idx" ON "referral_relationships"("status");

-- CreateIndex
CREATE INDEX "referral_relationships_fraud_review_status_idx" ON "referral_relationships"("fraud_review_status");

-- CreateIndex
CREATE INDEX "referral_relationships_attach_device_install_id_idx" ON "referral_relationships"("attach_device_install_id");

-- CreateIndex
CREATE INDEX "referral_relationships_qualified_at_idx" ON "referral_relationships"("qualified_at");

-- CreateIndex
CREATE INDEX "referral_relationships_rewarded_at_idx" ON "referral_relationships"("rewarded_at");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_campaigns_code_key" ON "promotion_campaigns"("code");

-- CreateIndex
CREATE INDEX "rate_limit_buckets_scope_identifier_idx" ON "rate_limit_buckets"("scope", "identifier");

-- CreateIndex
CREATE INDEX "rate_limit_buckets_blocked_until_idx" ON "rate_limit_buckets"("blocked_until");

-- CreateIndex
CREATE UNIQUE INDEX "rate_limit_buckets_scope_identifier_window_started_at_key" ON "rate_limit_buckets"("scope", "identifier", "window_started_at");

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_photos" ADD CONSTRAINT "property_photos_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_coverages" ADD CONSTRAINT "property_coverages_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_coverages" ADD CONSTRAINT "property_coverages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_coverages" ADD CONSTRAINT "property_coverages_renewed_from_id_fkey" FOREIGN KEY ("renewed_from_id") REFERENCES "property_coverages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_checkout_sessions" ADD CONSTRAINT "property_checkout_sessions_coverage_id_fkey" FOREIGN KEY ("coverage_id") REFERENCES "property_coverages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_checkout_sessions" ADD CONSTRAINT "property_checkout_sessions_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_checkout_sessions" ADD CONSTRAINT "property_checkout_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stolen_reports" ADD CONSTRAINT "stolen_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stolen_reports" ADD CONSTRAINT "stolen_reports_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_coverage_id_fkey" FOREIGN KEY ("coverage_id") REFERENCES "property_coverages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_stolen_report_id_fkey" FOREIGN KEY ("stolen_report_id") REFERENCES "stolen_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_payment_event_log_id_fkey" FOREIGN KEY ("payment_event_log_id") REFERENCES "payment_event_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_stolen_report_id_fkey" FOREIGN KEY ("stolen_report_id") REFERENCES "stolen_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_coverage_id_fkey" FOREIGN KEY ("coverage_id") REFERENCES "property_coverages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_notes" ADD CONSTRAINT "admin_notes_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_notes" ADD CONSTRAINT "admin_notes_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_notes" ADD CONSTRAINT "admin_notes_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_notes" ADD CONSTRAINT "admin_notes_stolen_report_id_fkey" FOREIGN KEY ("stolen_report_id") REFERENCES "stolen_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_receipts" ADD CONSTRAINT "billing_receipts_coverage_id_fkey" FOREIGN KEY ("coverage_id") REFERENCES "property_coverages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_receipts" ADD CONSTRAINT "billing_receipts_checkout_session_id_fkey" FOREIGN KEY ("checkout_session_id") REFERENCES "property_checkout_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_receipts" ADD CONSTRAINT "billing_receipts_payment_event_log_id_fkey" FOREIGN KEY ("payment_event_log_id") REFERENCES "payment_event_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_receipts" ADD CONSTRAINT "billing_receipts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_receipts" ADD CONSTRAINT "billing_receipts_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_public_verifications" ADD CONSTRAINT "property_public_verifications_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_expired_from_transaction_id_fkey" FOREIGN KEY ("expired_from_transaction_id") REFERENCES "wallet_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_promotion_campaign_id_fkey" FOREIGN KEY ("promotion_campaign_id") REFERENCES "promotion_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_profiles" ADD CONSTRAINT "referral_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_relationships" ADD CONSTRAINT "referral_relationships_referral_profile_id_fkey" FOREIGN KEY ("referral_profile_id") REFERENCES "referral_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_relationships" ADD CONSTRAINT "referral_relationships_referrer_user_id_fkey" FOREIGN KEY ("referrer_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_relationships" ADD CONSTRAINT "referral_relationships_referred_user_id_fkey" FOREIGN KEY ("referred_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_relationships" ADD CONSTRAINT "referral_relationships_qualification_checkout_session_id_fkey" FOREIGN KEY ("qualification_checkout_session_id") REFERENCES "property_checkout_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_relationships" ADD CONSTRAINT "referral_relationships_qualification_coverage_id_fkey" FOREIGN KEY ("qualification_coverage_id") REFERENCES "property_coverages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
