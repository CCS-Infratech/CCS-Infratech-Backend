-- CreateTable
CREATE TABLE "Press" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Press_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PressItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "publicationName" TEXT,
    "publicationDate" TIMESTAMP(3),
    "url" TEXT NOT NULL,
    "imageUrl" TEXT,
    "excerpt" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "pressId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PressItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Press_slug_key" ON "Press"("slug");

-- CreateIndex
CREATE INDEX "Press_slug_idx" ON "Press"("slug");

-- CreateIndex
CREATE INDEX "Press_isActive_idx" ON "Press"("isActive");

-- CreateIndex
CREATE INDEX "PressItem_pressId_idx" ON "PressItem"("pressId");

-- AddForeignKey
ALTER TABLE "PressItem" ADD CONSTRAINT "PressItem_pressId_fkey" FOREIGN KEY ("pressId") REFERENCES "Press"("id") ON DELETE CASCADE ON UPDATE CASCADE;
