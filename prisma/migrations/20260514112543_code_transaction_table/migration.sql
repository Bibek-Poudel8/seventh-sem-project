/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `transactions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "transactionCode" TEXT,
ADD COLUMN     "transactionId" TEXT;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "code" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "transactions_code_key" ON "transactions"("code");
