-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "show_grid_cell_predictions" BOOLEAN NOT NULL DEFAULT true;
