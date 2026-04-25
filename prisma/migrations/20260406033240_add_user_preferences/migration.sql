-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN     "dateFormat" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
ADD COLUMN     "defaultTransactionType" "TransactionType" NOT NULL DEFAULT 'EXPENSE',
ADD COLUMN     "pushSubscription" TEXT,
ADD COLUMN     "weekStartsOn" INTEGER NOT NULL DEFAULT 1;
