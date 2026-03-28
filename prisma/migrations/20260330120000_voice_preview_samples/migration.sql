-- CreateTable
CREATE TABLE "voice_preview_samples" (
    "id" TEXT NOT NULL,
    "eleven_voice_id" TEXT NOT NULL,
    "phrase_text" TEXT NOT NULL,
    "audio_mpeg" BYTEA NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voice_preview_samples_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "voice_preview_samples_eleven_voice_id_key" ON "voice_preview_samples"("eleven_voice_id");
