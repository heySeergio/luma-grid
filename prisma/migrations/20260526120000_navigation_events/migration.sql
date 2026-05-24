-- CreateTable
CREATE TABLE "navigation_events" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "folder_target" TEXT,
    "phrase_length" INTEGER NOT NULL DEFAULT 0,
    "folder_depth" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "navigation_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "navigation_events_profile_id_created_at_idx" ON "navigation_events"("profile_id", "created_at");

-- CreateIndex
CREATE INDEX "navigation_events_profile_id_action_created_at_idx" ON "navigation_events"("profile_id", "action", "created_at");

-- AddForeignKey
ALTER TABLE "navigation_events" ADD CONSTRAINT "navigation_events_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
