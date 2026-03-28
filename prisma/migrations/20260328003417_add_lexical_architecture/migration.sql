-- CreateTable
CREATE TABLE "lexemes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lemma" TEXT NOT NULL,
    "normalized_lemma" TEXT NOT NULL,
    "primary_pos" TEXT NOT NULL,
    "secondary_pos" TEXT,
    "gender" TEXT,
    "number_behavior" TEXT,
    "verb_group" TEXT,
    "is_irregular" BOOLEAN NOT NULL DEFAULT false,
    "is_reflexive" BOOLEAN NOT NULL DEFAULT false,
    "transitivity" TEXT,
    "frequency_score" REAL,
    "aac_priority" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'seed',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "lexeme_forms" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lexeme_id" TEXT NOT NULL,
    "surface" TEXT NOT NULL,
    "normalized_surface" TEXT NOT NULL,
    "form_type" TEXT NOT NULL,
    "person" INTEGER,
    "tense" TEXT,
    "mood" TEXT,
    "number" TEXT,
    "gender" TEXT,
    "confidence" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lexeme_forms_lexeme_id_fkey" FOREIGN KEY ("lexeme_id") REFERENCES "lexemes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lexeme_aliases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lexeme_id" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "normalized_alias" TEXT NOT NULL,
    "alias_type" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lexeme_aliases_lexeme_id_fkey" FOREIGN KEY ("lexeme_id") REFERENCES "lexemes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "prediction_transitions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profile_id" TEXT NOT NULL,
    "from_lexeme_id" TEXT,
    "to_lexeme_id" TEXT,
    "from_symbol_label" TEXT,
    "to_symbol_label" TEXT,
    "count" INTEGER NOT NULL DEFAULT 0,
    "last_used_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "prediction_transitions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "prediction_transitions_from_lexeme_id_fkey" FOREIGN KEY ("from_lexeme_id") REFERENCES "lexemes" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "prediction_transitions_to_lexeme_id_fkey" FOREIGN KEY ("to_lexeme_id") REFERENCES "lexemes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "symbol_usage_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profile_id" TEXT NOT NULL,
    "symbol_id" TEXT,
    "lexeme_id" TEXT,
    "phrase_session_id" TEXT NOT NULL,
    "sequence_index" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "symbol_usage_events_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "symbol_usage_events_symbol_id_fkey" FOREIGN KEY ("symbol_id") REFERENCES "symbols" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "symbol_usage_events_lexeme_id_fkey" FOREIGN KEY ("lexeme_id") REFERENCES "lexemes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_symbols" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profile_id" TEXT NOT NULL,
    "grid_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "normalized_label" TEXT NOT NULL DEFAULT '',
    "emoji" TEXT,
    "image_url" TEXT,
    "category" TEXT NOT NULL,
    "pos_type" TEXT NOT NULL,
    "pos_confidence" REAL,
    "manual_grammar_override" BOOLEAN NOT NULL DEFAULT false,
    "lexeme_id" TEXT,
    "position_x" INTEGER NOT NULL,
    "position_y" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "state" TEXT NOT NULL DEFAULT 'visible',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "symbols_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "symbols_lexeme_id_fkey" FOREIGN KEY ("lexeme_id") REFERENCES "lexemes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_symbols" ("category", "color", "created_at", "emoji", "grid_id", "hidden", "id", "image_url", "label", "pos_type", "position_x", "position_y", "profile_id", "state", "updated_at") SELECT "category", "color", "created_at", "emoji", "grid_id", "hidden", "id", "image_url", "label", "pos_type", "position_x", "position_y", "profile_id", "state", "updated_at" FROM "symbols";
DROP TABLE "symbols";
ALTER TABLE "new_symbols" RENAME TO "symbols";
CREATE INDEX "symbols_normalized_label_idx" ON "symbols"("normalized_label");
CREATE INDEX "symbols_lexeme_id_idx" ON "symbols"("lexeme_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "lexemes_primary_pos_idx" ON "lexemes"("primary_pos");

-- CreateIndex
CREATE INDEX "lexemes_aac_priority_idx" ON "lexemes"("aac_priority");

-- CreateIndex
CREATE UNIQUE INDEX "lexemes_normalized_lemma_primary_pos_key" ON "lexemes"("normalized_lemma", "primary_pos");

-- CreateIndex
CREATE INDEX "lexeme_forms_normalized_surface_idx" ON "lexeme_forms"("normalized_surface");

-- CreateIndex
CREATE UNIQUE INDEX "lexeme_forms_lexeme_id_normalized_surface_form_type_key" ON "lexeme_forms"("lexeme_id", "normalized_surface", "form_type");

-- CreateIndex
CREATE INDEX "lexeme_aliases_normalized_alias_idx" ON "lexeme_aliases"("normalized_alias");

-- CreateIndex
CREATE UNIQUE INDEX "lexeme_aliases_lexeme_id_normalized_alias_alias_type_key" ON "lexeme_aliases"("lexeme_id", "normalized_alias", "alias_type");

-- CreateIndex
CREATE INDEX "prediction_transitions_profile_id_count_idx" ON "prediction_transitions"("profile_id", "count");

-- CreateIndex
CREATE INDEX "prediction_transitions_from_lexeme_id_to_lexeme_id_idx" ON "prediction_transitions"("from_lexeme_id", "to_lexeme_id");

-- CreateIndex
CREATE INDEX "symbol_usage_events_profile_id_created_at_idx" ON "symbol_usage_events"("profile_id", "created_at");

-- CreateIndex
CREATE INDEX "symbol_usage_events_phrase_session_id_sequence_index_idx" ON "symbol_usage_events"("phrase_session_id", "sequence_index");

-- CreateIndex
CREATE INDEX "symbol_usage_events_lexeme_id_idx" ON "symbol_usage_events"("lexeme_id");
