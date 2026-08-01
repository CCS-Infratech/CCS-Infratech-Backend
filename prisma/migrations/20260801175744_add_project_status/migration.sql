-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('UNDER_CONSTRUCTION', 'COMPLETED');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "status" "ProjectStatus" NOT NULL DEFAULT 'UNDER_CONSTRUCTION';
