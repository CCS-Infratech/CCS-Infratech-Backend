-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "currentPlanBrochureUrl" TEXT,
ADD COLUMN     "currentPlanHeadline" TEXT,
ADD COLUMN     "currentPlanImage" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "locationDetails" TEXT,
ADD COLUMN     "mapUrl" TEXT,
ADD COLUMN     "nearbyAttractions" TEXT,
ADD COLUMN     "overviewDescription" TEXT,
ADD COLUMN     "overviewHeadline" TEXT,
ADD COLUMN     "sitePlanBrochureUrl" TEXT,
ADD COLUMN     "sitePlanHeadline" TEXT,
ADD COLUMN     "sitePlanImage" TEXT,
ADD COLUMN     "unitPlanBrochureUrl" TEXT,
ADD COLUMN     "unitPlanHeadline" TEXT,
ADD COLUMN     "unitPlanImage" TEXT;

-- CreateTable
CREATE TABLE "ProjectSpecification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectSpecification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectAmenity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectAmenity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectSpecification_projectId_idx" ON "ProjectSpecification"("projectId");

-- CreateIndex
CREATE INDEX "ProjectAmenity_projectId_idx" ON "ProjectAmenity"("projectId");

-- AddForeignKey
ALTER TABLE "ProjectSpecification" ADD CONSTRAINT "ProjectSpecification_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAmenity" ADD CONSTRAINT "ProjectAmenity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
