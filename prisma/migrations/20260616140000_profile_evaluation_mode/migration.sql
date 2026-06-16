-- CreateEnum
CREATE TYPE "EvaluationMode" AS ENUM ('UNSET', 'NONE', 'SIMPLE', 'FULL');

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN "evaluation_mode" "EvaluationMode" NOT NULL DEFAULT 'UNSET';
