/*
  Warnings:

  - You are about to drop the column `clientName` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `projectUrl` on the `Project` table. All the data in the column will be lost.
  - Added the required column `logoUrl` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Project" DROP COLUMN "clientName",
DROP COLUMN "projectUrl",
ADD COLUMN     "logoUrl" TEXT NOT NULL;
