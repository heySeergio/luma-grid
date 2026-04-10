-- Celda del grid principal visible también dentro de carpetas (zona fija).
ALTER TABLE "symbols" ADD COLUMN IF NOT EXISTS "fixed_cell" BOOLEAN NOT NULL DEFAULT false;
