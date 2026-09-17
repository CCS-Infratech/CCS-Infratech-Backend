-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "companyName" TEXT,
    "companyDescription" TEXT,
    "phone" TEXT,
    "phone2" TEXT,
    "email" TEXT,
    "email2" TEXT,
    "whatsapp" TEXT,
    "websiteUrl" TEXT,
    "address" TEXT,
    "registeredOffice" TEXT,
    "corporateOffice" TEXT,
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "youtubeUrl" TEXT,
    "linkedinUrl" TEXT,
    "twitterUrl" TEXT,
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "footerText" TEXT,
    "mapUrl" TEXT,
    "googleMapUrl" TEXT,
    "workingHours" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Leadership" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "imageUrl" TEXT,
    "experience" TEXT,
    "bio" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Leadership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Leadership_isActive_idx" ON "Leadership"("isActive");

-- CreateIndex
CREATE INDEX "Leadership_sortOrder_idx" ON "Leadership"("sortOrder");

