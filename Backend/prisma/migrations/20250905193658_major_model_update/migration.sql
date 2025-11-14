-- AlterTable
ALTER TABLE "public"."Blog" ALTER COLUMN "likes" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "profilePic" TEXT,
ADD COLUMN     "totalLikes" INTEGER NOT NULL DEFAULT 0;
