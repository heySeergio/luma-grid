-- AlterTable
ALTER TABLE "lexemes" ADD COLUMN     "semantic_layer" TEXT NOT NULL DEFAULT 'other',
ADD COLUMN     "is_core" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pictogram_source" TEXT,
ADD COLUMN     "pictogram_key" TEXT;

-- Backfill semántica aproximada desde POS existente
UPDATE "lexemes" SET "semantic_layer" = CASE
  WHEN "primary_pos" = 'verb' THEN 'actions'
  WHEN "primary_pos" = 'noun' THEN 'objects'
  WHEN "primary_pos" = 'pronoun' THEN 'core'
  WHEN "primary_pos" = 'adverb' THEN 'core'
  WHEN "primary_pos" = 'adj' THEN 'other'
  ELSE 'other'
END;

-- Heurística núcleo: pronombres/adverbios de función y prioridad AAC alta
UPDATE "lexemes" SET "is_core" = true
WHERE "primary_pos" IN ('pronoun', 'adverb')
   OR ("aac_priority" IS NOT NULL AND "aac_priority" >= 80);

CREATE INDEX "lexemes_semantic_layer_idx" ON "lexemes"("semantic_layer");
CREATE INDEX "lexemes_is_core_idx" ON "lexemes"("is_core");
