-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "default_tablero_tab" TEXT NOT NULL DEFAULT 'grid';
