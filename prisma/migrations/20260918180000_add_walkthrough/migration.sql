CREATE TABLE "Walkthrough" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "videoUrl" TEXT NOT NULL,
    "thumbnail" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Walkthrough_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Walkthrough_isActive_idx" ON "Walkthrough"("isActive");
CREATE INDEX "Walkthrough_sortOrder_idx" ON "Walkthrough"("sortOrder");
