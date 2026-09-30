-- Align live currency defaults with schema.prisma (drift found when baselining).
ALTER TABLE "billing_receipts" ALTER COLUMN "currency" SET DEFAULT 'NGN';
ALTER TABLE "property_checkout_sessions" ALTER COLUMN "currency" SET DEFAULT 'NGN';
ALTER TABLE "property_coverages" ALTER COLUMN "currency" SET DEFAULT 'NGN';
