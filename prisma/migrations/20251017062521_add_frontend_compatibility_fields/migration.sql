-- AlterTable
ALTER TABLE "leave_balances" ADD COLUMN     "pending" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "leave_requests" ADD COLUMN     "half_day_end" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "half_day_start" BOOLEAN NOT NULL DEFAULT false;
