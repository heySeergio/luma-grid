-- Substring / ILIKE-style search on normalized_lemma (Prisma `contains`) uses pg_trgm GIN.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "lexemes_normalized_lemma_trgm_idx" ON "lexemes" USING gin ("normalized_lemma" gin_trgm_ops);
