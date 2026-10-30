-- CreateTable
CREATE TABLE "public"."FeedRun" (
    "id" SERIAL NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "found" INTEGER NOT NULL,
    "added" INTEGER NOT NULL,
    "summary" JSONB NOT NULL,

    CONSTRAINT "FeedRun_pkey" PRIMARY KEY ("id")
);
