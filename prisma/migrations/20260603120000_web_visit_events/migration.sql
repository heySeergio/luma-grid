-- CreateTable
CREATE TABLE "web_visit_events" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "referrer" TEXT,
    "referrer_host" TEXT,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "country" CHAR(2),
    "city" TEXT,
    "duration_sec" INTEGER,
    "visitor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "web_visit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "web_search_events" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "path" TEXT,
    "visitor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "web_search_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "web_visit_events_created_at_idx" ON "web_visit_events"("created_at");

-- CreateIndex
CREATE INDEX "web_visit_events_path_created_at_idx" ON "web_visit_events"("path", "created_at");

-- CreateIndex
CREATE INDEX "web_visit_events_referrer_host_created_at_idx" ON "web_visit_events"("referrer_host", "created_at");

-- CreateIndex
CREATE INDEX "web_visit_events_utm_source_created_at_idx" ON "web_visit_events"("utm_source", "created_at");

-- CreateIndex
CREATE INDEX "web_visit_events_visitor_id_created_at_idx" ON "web_visit_events"("visitor_id", "created_at");

-- CreateIndex
CREATE INDEX "web_search_events_created_at_idx" ON "web_search_events"("created_at");
