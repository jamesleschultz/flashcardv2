/*
  Warnings:

  - The primary key for the `decks` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `flashcards` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `ease_factor` on the `flashcards` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `flashcards` table. All the data in the column will be lost.
  - You are about to drop the `profiles` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `interval` on table `flashcards` required. This step will fail if there are existing NULL values in that column.
  - Made the column `next_review_date` on table `flashcards` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('MANUAL', 'PDF_IMPORT', 'TEXT_IMPORT', 'AI_GENERATED');

-- DropForeignKey
ALTER TABLE "decks" DROP CONSTRAINT "decks_user_id_fkey";

-- DropForeignKey
ALTER TABLE "flashcards" DROP CONSTRAINT "flashcards_deck_id_fkey";

-- DropIndex
DROP INDEX "decks_user_id_idx";

-- DropIndex
DROP INDEX "flashcards_deck_id_idx";

-- DropIndex
DROP INDEX "flashcards_next_review_date_idx";

-- DropIndex
DROP INDEX "flashcards_user_id_idx";

-- AlterTable
ALTER TABLE "decks" DROP CONSTRAINT "decks_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "decks_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "flashcards" DROP CONSTRAINT "flashcards_pkey",
DROP COLUMN "ease_factor",
DROP COLUMN "user_id",
ADD COLUMN     "easiness_factor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
ADD COLUMN     "repetitions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "source_ref" TEXT,
ADD COLUMN     "source_type" "SourceType",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "deck_id" SET DATA TYPE TEXT,
ALTER COLUMN "interval" SET NOT NULL,
ALTER COLUMN "next_review_date" SET NOT NULL,
ALTER COLUMN "next_review_date" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "next_review_date" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "flashcards_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "profiles";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DeckToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DeckToTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE INDEX "_DeckToTag_B_index" ON "_DeckToTag"("B");

-- AddForeignKey
ALTER TABLE "decks" ADD CONSTRAINT "decks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_deck_id_fkey" FOREIGN KEY ("deck_id") REFERENCES "decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DeckToTag" ADD CONSTRAINT "_DeckToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DeckToTag" ADD CONSTRAINT "_DeckToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
