-- CreateTable
CREATE TABLE "tts_phrase_cache" (
    "id" TEXT NOT NULL,
    "eleven_voice_id" TEXT NOT NULL,
    "phrase_key" TEXT NOT NULL,
    "source_text" TEXT NOT NULL,
    "audio_mpeg" BYTEA NOT NULL,
    "hit_count" INTEGER NOT NULL DEFAULT 0,
    "char_length" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_hit_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tts_phrase_cache_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tts_phrase_cache_eleven_voice_id_phrase_key_key" ON "tts_phrase_cache"("eleven_voice_id", "phrase_key");
CREATE INDEX "tts_phrase_cache_eleven_voice_id_idx" ON "tts_phrase_cache"("eleven_voice_id");
