/*
  Warnings:

  - You are about to drop the column `admin` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "admin",
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'USER';
