/*
  Warnings:

  - You are about to drop the column `published` on the `Blog` table. All the data in the column will be lost.
  - Added the required column `likes` to the `Blog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Blog" DROP COLUMN "published",
ADD COLUMN     "latest" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "likes" INTEGER NOT NULL,
ADD COLUMN     "trending" BOOLEAN NOT NULL DEFAULT false;
