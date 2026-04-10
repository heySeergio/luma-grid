-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "share_usage_for_predictions" BOOLEAN NOT NULL DEFAULT true;
