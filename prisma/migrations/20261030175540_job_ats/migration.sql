-- AlterTable
ALTER TABLE "public"."Job" ADD COLUMN     "ats" JSONB,
ADD COLUMN     "atsScore" INTEGER,
ADD COLUMN     "note" TEXT;
