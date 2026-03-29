-- AlterTable: cuentas solo Google no tienen hash de contraseña local.
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;
