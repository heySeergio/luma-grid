-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripe_subscription_id" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "plan_expires_at" TIMESTAMP(3);

-- Valores de plan en español (libre / voz / identidad)
UPDATE "User" SET "plan" = 'libre' WHERE "plan" = 'free';
UPDATE "User" SET "plan" = 'voz' WHERE "plan" = 'voice';
UPDATE "User" SET "plan" = 'identidad' WHERE "plan" IN ('identity', 'pro');

ALTER TABLE "User" ALTER COLUMN "plan" SET DEFAULT 'libre';
