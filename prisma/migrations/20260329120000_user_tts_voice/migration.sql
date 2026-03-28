-- AlterTable
ALTER TABLE "User" ADD COLUMN "tts_mode" TEXT NOT NULL DEFAULT 'browser';
ALTER TABLE "User" ADD COLUMN "voice_id" TEXT;
ALTER TABLE "User" ADD COLUMN "characters_used" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "tts_billing_month" TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ADD COLUMN "plan" TEXT NOT NULL DEFAULT 'free';

-- CreateTable
CREATE TABLE "voice_presets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "eleven_voice_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voice_presets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "voice_presets_eleven_voice_id_key" ON "voice_presets"("eleven_voice_id");
