-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "show_frequent_phrases_section" BOOLEAN NOT NULL DEFAULT true;
