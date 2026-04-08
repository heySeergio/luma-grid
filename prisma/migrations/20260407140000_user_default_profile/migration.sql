-- Perfil al abrir /tablero (separado de is_demo = tablero demo fijo).
-- La tabla de usuarios en este proyecto es "User" (modelo Prisma sin @@map).

ALTER TABLE "User" ADD COLUMN "default_profile_id" TEXT;

UPDATE "User" u
SET "default_profile_id" = sub.id
FROM (
  SELECT DISTINCT ON (p.user_id) p.id, p.user_id
  FROM "profiles" p
  WHERE p.is_demo = true
  ORDER BY p.user_id, p.created_at ASC
) sub
WHERE u.id = sub.user_id;

UPDATE "User" u
SET "default_profile_id" = (
  SELECT p.id FROM "profiles" p WHERE p.user_id = u.id ORDER BY p.created_at ASC LIMIT 1
)
WHERE u."default_profile_id" IS NULL;

UPDATE "profiles" p
SET is_demo = (
  p.id = (
    SELECT p2.id FROM "profiles" p2
    WHERE p2.user_id = p.user_id
    ORDER BY p2.created_at ASC
    LIMIT 1
  )
);

ALTER TABLE "User" ADD CONSTRAINT "User_default_profile_id_fkey"
  FOREIGN KEY ("default_profile_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
