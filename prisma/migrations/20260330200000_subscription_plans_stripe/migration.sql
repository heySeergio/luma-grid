-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripe_customer_id" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "plan_selection_completed_at" TIMESTAMP(3);

-- Antiguo plan pro -> identity
UPDATE "User" SET "plan" = 'identity' WHERE "plan" = 'pro';

-- Usuarios existentes: ya completaron onboarding (no mostrar modal)
UPDATE "User" SET "plan_selection_completed_at" = CURRENT_TIMESTAMP WHERE "plan_selection_completed_at" IS NULL;
