-- CreateTable
CREATE TABLE "utterance_events" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "symbol_count" INTEGER NOT NULL,
    "duration_ms" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'speak',
    "symbols_used" JSONB NOT NULL,
    "inferred_intent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "utterance_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "utterance_events_profile_id_created_at_idx" ON "utterance_events"("profile_id", "created_at");

-- AddForeignKey
ALTER TABLE "utterance_events" ADD CONSTRAINT "utterance_events_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
