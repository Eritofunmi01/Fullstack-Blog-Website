-- CreateTable
CREATE TABLE "public"."Blog" (
    "id" SERIAL NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "img" TEXT NOT NULL,
    "story" TEXT NOT NULL,
    "latest" BOOLEAN NOT NULL DEFAULT false,
    "trending" BOOLEAN NOT NULL DEFAULT false,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Blog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Blog" ADD CONSTRAINT "Blog_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
