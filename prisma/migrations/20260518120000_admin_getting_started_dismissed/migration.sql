-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "admin_getting_started_dismissed" BOOLEAN NOT NULL DEFAULT false;
