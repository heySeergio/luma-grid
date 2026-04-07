-- Tier léxico: núcleo curado (Fase 1–2, seed) vs ampliado (Fase 3+ import masivo con menor peso en predicción).
ALTER TABLE "lexemes" ADD COLUMN "lexeme_tier" TEXT NOT NULL DEFAULT 'curated';

CREATE INDEX "lexemes_lexeme_tier_idx" ON "lexemes"("lexeme_tier");
