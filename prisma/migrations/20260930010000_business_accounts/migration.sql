-- CreateEnum
CREATE TYPE "business_type" AS ENUM ('business_name', 'private_limited', 'public_limited', 'incorporated_trustees', 'partnership', 'other');

-- CreateEnum
CREATE TYPE "business_verification_status" AS ENUM ('unsubmitted', 'pending', 'verified', 'rejected');

-- CreateEnum
CREATE TYPE "business_member_role" AS ENUM ('owner', 'admin', 'member', 'viewer');

-- CreateEnum
CREATE TYPE "business_invite_status" AS ENUM ('pending', 'accepted', 'revoked', 'expired');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "notification_type" ADD VALUE 'BusinessVerified';
ALTER TYPE "notification_type" ADD VALUE 'BusinessVerificationRejected';
ALTER TYPE "notification_type" ADD VALUE 'BusinessMemberJoined';
ALTER TYPE "notification_type" ADD VALUE 'BusinessRoleChanged';
ALTER TYPE "notification_type" ADD VALUE 'BusinessMemberRemoved';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "audit_log_entity_type" ADD VALUE 'Business';
ALTER TYPE "audit_log_entity_type" ADD VALUE 'BusinessMember';
ALTER TYPE "audit_log_entity_type" ADD VALUE 'BusinessInvite';

-- AlterEnum
ALTER TYPE "admin_note_target_type" ADD VALUE 'Business';

-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "asset_tag" VARCHAR(100),
ADD COLUMN     "business_id" VARCHAR(255),
ADD COLUMN     "location" VARCHAR(255);

-- AlterTable
ALTER TABLE "property_coverages" ADD COLUMN     "business_id" VARCHAR(255);

-- AlterTable
ALTER TABLE "property_checkout_sessions" ADD COLUMN     "asset_tag" VARCHAR(100),
ADD COLUMN     "business_id" VARCHAR(255),
ADD COLUMN     "location" VARCHAR(255);

-- AlterTable
ALTER TABLE "stolen_reports" ADD COLUMN     "business_id" VARCHAR(255);

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "business_id" VARCHAR(255);

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "business_id" VARCHAR(255);

-- AlterTable
ALTER TABLE "admin_notes" ADD COLUMN     "business_id" VARCHAR(255);

-- AlterTable
ALTER TABLE "billing_receipts" ADD COLUMN     "business_id" VARCHAR(255);

-- CreateTable
CREATE TABLE "businesses" (
    "id" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "business_type" "business_type" NOT NULL,
    "registration_number" VARCHAR(50) NOT NULL,
    "tax_id" VARCHAR(50),
    "industry" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone_number" VARCHAR(50) NOT NULL,
    "website" VARCHAR(255),
    "address_line" VARCHAR(255) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "country" VARCHAR(100) NOT NULL DEFAULT 'Nigeria',
    "logo_url" VARCHAR(500),
    "cac_document_url" VARCHAR(500),
    "verification_status" "business_verification_status" NOT NULL DEFAULT 'unsubmitted',
    "verification_note" TEXT,
    "submitted_at" TIMESTAMPTZ,
    "verified_at" TIMESTAMPTZ,
    "verified_by_user_id" VARCHAR(255),
    "created_by_user_id" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_members" (
    "id" VARCHAR(255) NOT NULL,
    "business_id" VARCHAR(255) NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "role" "business_member_role" NOT NULL DEFAULT 'member',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_invites" (
    "id" VARCHAR(255) NOT NULL,
    "business_id" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "role" "business_member_role" NOT NULL DEFAULT 'member',
    "token_hash" VARCHAR(64) NOT NULL,
    "status" "business_invite_status" NOT NULL DEFAULT 'pending',
    "invited_by_user_id" VARCHAR(255) NOT NULL,
    "accepted_by_user_id" VARCHAR(255),
    "expires_at" TIMESTAMPTZ NOT NULL,
    "accepted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "businesses_slug_key" ON "businesses"("slug");

-- CreateIndex
CREATE INDEX "businesses_registration_number_idx" ON "businesses"("registration_number");

-- CreateIndex
CREATE INDEX "businesses_verification_status_idx" ON "businesses"("verification_status");

-- CreateIndex
CREATE INDEX "businesses_created_by_user_id_idx" ON "businesses"("created_by_user_id");

-- CreateIndex
CREATE INDEX "business_members_user_id_idx" ON "business_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "business_members_business_id_user_id_key" ON "business_members"("business_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "business_invites_token_hash_key" ON "business_invites"("token_hash");

-- CreateIndex
CREATE INDEX "business_invites_business_id_status_idx" ON "business_invites"("business_id", "status");

-- CreateIndex
CREATE INDEX "business_invites_email_status_idx" ON "business_invites"("email", "status");

-- CreateIndex
CREATE INDEX "properties_business_id_idx" ON "properties"("business_id");

-- CreateIndex
CREATE INDEX "properties_business_id_asset_tag_idx" ON "properties"("business_id", "asset_tag");

-- CreateIndex
CREATE INDEX "property_coverages_business_id_status_idx" ON "property_coverages"("business_id", "status");

-- CreateIndex
CREATE INDEX "property_checkout_sessions_business_id_idx" ON "property_checkout_sessions"("business_id");

-- CreateIndex
CREATE INDEX "stolen_reports_business_id_idx" ON "stolen_reports"("business_id");

-- CreateIndex
CREATE INDEX "notifications_business_id_idx" ON "notifications"("business_id");

-- CreateIndex
CREATE INDEX "audit_logs_business_id_idx" ON "audit_logs"("business_id");

-- CreateIndex
CREATE INDEX "admin_notes_business_id_idx" ON "admin_notes"("business_id");

-- CreateIndex
CREATE INDEX "billing_receipts_business_id_idx" ON "billing_receipts"("business_id");

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_verified_by_user_id_fkey" FOREIGN KEY ("verified_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_members" ADD CONSTRAINT "business_members_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_members" ADD CONSTRAINT "business_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_invites" ADD CONSTRAINT "business_invites_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_invites" ADD CONSTRAINT "business_invites_invited_by_user_id_fkey" FOREIGN KEY ("invited_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_invites" ADD CONSTRAINT "business_invites_accepted_by_user_id_fkey" FOREIGN KEY ("accepted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_coverages" ADD CONSTRAINT "property_coverages_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_checkout_sessions" ADD CONSTRAINT "property_checkout_sessions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stolen_reports" ADD CONSTRAINT "stolen_reports_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_notes" ADD CONSTRAINT "admin_notes_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_receipts" ADD CONSTRAINT "billing_receipts_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
