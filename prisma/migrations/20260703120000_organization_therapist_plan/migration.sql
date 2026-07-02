-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "owner_user_id" TEXT NOT NULL,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "included_user_slots" INTEGER NOT NULL DEFAULT 10,
    "extra_user_slots" INTEGER NOT NULL DEFAULT 0,
    "included_therapist_seats" INTEGER NOT NULL DEFAULT 1,
    "extra_therapist_seats" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_members" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "invite_email" TEXT,
    "invite_status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "managed_end_users" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "display_label" TEXT,
    "invite_email" TEXT,
    "invite_status" TEXT,
    "archived_at" TIMESTAMP(3),
    "last_accessed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "managed_end_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acting_session_logs" (
    "id" TEXT NOT NULL,
    "actor_user_id" TEXT NOT NULL,
    "effective_user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "acting_session_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_owner_user_id_key" ON "organizations"("owner_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_user_id_key" ON "organization_members"("user_id");

-- CreateIndex
CREATE INDEX "organization_members_organization_id_idx" ON "organization_members"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "managed_end_users_user_id_key" ON "managed_end_users"("user_id");

-- CreateIndex
CREATE INDEX "managed_end_users_organization_id_idx" ON "managed_end_users"("organization_id");

-- CreateIndex
CREATE INDEX "acting_session_logs_actor_user_id_created_at_idx" ON "acting_session_logs"("actor_user_id", "created_at");

-- CreateIndex
CREATE INDEX "acting_session_logs_effective_user_id_created_at_idx" ON "acting_session_logs"("effective_user_id", "created_at");

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "managed_end_users" ADD CONSTRAINT "managed_end_users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "managed_end_users" ADD CONSTRAINT "managed_end_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acting_session_logs" ADD CONSTRAINT "acting_session_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
