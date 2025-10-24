-- CreateTable
CREATE TABLE "public"."BlogLike" (
    "id" SERIAL NOT NULL,
    "blogId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "liked" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlogLike_blogId_userId_key" ON "public"."BlogLike"("blogId", "userId");
