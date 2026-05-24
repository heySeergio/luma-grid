-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "show_rest_mode_button" BOOLEAN NOT NULL DEFAULT true;
