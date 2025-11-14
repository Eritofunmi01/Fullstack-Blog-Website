/*
  Warnings:

  - You are about to drop the column `likes` on the `Blog` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."BlogLike" DROP CONSTRAINT "BlogLike_blogId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Comment" DROP CONSTRAINT "Comment_blogId_fkey";

-- AlterTable
ALTER TABLE "public"."Blog" DROP COLUMN "likes";

-- AlterTable
ALTER TABLE "public"."Comment" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "public"."Blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BlogLike" ADD CONSTRAINT "BlogLike_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "public"."Blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
