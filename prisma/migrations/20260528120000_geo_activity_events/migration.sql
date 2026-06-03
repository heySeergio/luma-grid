-- CreateTable
CREATE TABLE "geo_activity_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "event_type" TEXT NOT NULL,
    "path" TEXT,
    "country" CHAR(2),
    "region_code" TEXT,
    "region_name" TEXT,
    "city" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "geo_activity_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "geo_activity_events_created_at_idx" ON "geo_activity_events"("created_at");

-- CreateIndex
CREATE INDEX "geo_activity_events_country_region_code_idx" ON "geo_activity_events"("country", "region_code");

-- CreateIndex
CREATE INDEX "geo_activity_events_user_id_created_at_idx" ON "geo_activity_events"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "geo_activity_events_event_type_created_at_idx" ON "geo_activity_events"("event_type", "created_at");

-- AddForeignKey
ALTER TABLE "geo_activity_events" ADD CONSTRAINT "geo_activity_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
