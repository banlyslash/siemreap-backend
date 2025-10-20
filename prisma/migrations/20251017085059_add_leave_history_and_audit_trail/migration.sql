-- CreateTable
CREATE TABLE "leave_audits" (
    "id" TEXT NOT NULL,
    "leave_request_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performed_by_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" TEXT,
    "previousStatus" "LeaveRequestStatus",
    "newStatus" "LeaveRequestStatus",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leave_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leave_audits_leave_request_id_idx" ON "leave_audits"("leave_request_id");

-- CreateIndex
CREATE INDEX "leave_audits_performed_by_id_idx" ON "leave_audits"("performed_by_id");

-- CreateIndex
CREATE INDEX "leave_audits_timestamp_idx" ON "leave_audits"("timestamp");

-- AddForeignKey
ALTER TABLE "leave_audits" ADD CONSTRAINT "leave_audits_leave_request_id_fkey" FOREIGN KEY ("leave_request_id") REFERENCES "leave_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_audits" ADD CONSTRAINT "leave_audits_performed_by_id_fkey" FOREIGN KEY ("performed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
