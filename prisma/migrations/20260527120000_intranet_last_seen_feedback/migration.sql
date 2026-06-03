-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "last_seen" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_last_seen_idx" ON "User"("last_seen");

-- AlterTable
ALTER TABLE "feedback_entries" ADD COLUMN IF NOT EXISTS "user_id" TEXT;
ALTER TABLE "feedback_entries" ADD COLUMN IF NOT EXISTS "type" TEXT;
ALTER TABLE "feedback_entries" ADD COLUMN IF NOT EXISTS "rating" INTEGER;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "feedback_entries_user_id_idx" ON "feedback_entries"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "feedback_entries_type_idx" ON "feedback_entries"("type");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "feedback_entries" ADD CONSTRAINT "feedback_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
