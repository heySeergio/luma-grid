-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "show_phrase_completion_section" BOOLEAN NOT NULL DEFAULT true;
