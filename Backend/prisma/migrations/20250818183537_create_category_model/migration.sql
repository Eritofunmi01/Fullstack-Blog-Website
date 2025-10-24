-- CreateTable
CREATE TABLE "public"."Categoty" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Categoty_pkey" PRIMARY KEY ("id")
);
