-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "anomalyReason" TEXT,
ADD COLUMN     "anomalyScore" DOUBLE PRECISION,
ADD COLUMN     "isAnomaly" BOOLEAN NOT NULL DEFAULT false;
