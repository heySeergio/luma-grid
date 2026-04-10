-- Símbolos siempre 1×1: eliminar columnas de tamaño en celdas.
ALTER TABLE "symbols" DROP COLUMN IF EXISTS "width_cells";
ALTER TABLE "symbols" DROP COLUMN IF EXISTS "height_cells";
