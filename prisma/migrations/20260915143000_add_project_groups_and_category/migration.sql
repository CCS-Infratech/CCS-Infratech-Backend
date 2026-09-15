-- CreateEnum
CREATE TYPE "ProjectCategory" AS ENUM ('RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'HEALTHCARE', 'RENOVATION');

-- CreateTable
CREATE TABLE "ProjectGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectGroup_slug_key" ON "ProjectGroup"("slug");

-- CreateIndex
CREATE INDEX "ProjectGroup_slug_idx" ON "ProjectGroup"("slug");

-- CreateIndex
CREATE INDEX "ProjectGroup_isActive_idx" ON "ProjectGroup"("isActive");

-- AlterTable
ALTER TABLE "Project" ADD COLUMN "category" "ProjectCategory" NOT NULL DEFAULT 'RESIDENTIAL';
ALTER TABLE "Project" ADD COLUMN "groupId" TEXT;

-- CreateIndex
CREATE INDEX "Project_groupId_idx" ON "Project"("groupId");

-- CreateIndex
CREATE INDEX "Project_category_idx" ON "Project"("category");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ProjectGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
