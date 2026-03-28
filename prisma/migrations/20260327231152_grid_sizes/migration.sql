-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "gender" TEXT NOT NULL DEFAULT 'male',
    "is_demo" BOOLEAN NOT NULL DEFAULT false,
    "grid_rows" INTEGER NOT NULL DEFAULT 8,
    "grid_cols" INTEGER NOT NULL DEFAULT 14,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_profiles" ("created_at", "gender", "id", "is_demo", "name", "updated_at", "user_id") SELECT "created_at", "gender", "id", "is_demo", "name", "updated_at", "user_id" FROM "profiles";
DROP TABLE "profiles";
ALTER TABLE "new_profiles" RENAME TO "profiles";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
