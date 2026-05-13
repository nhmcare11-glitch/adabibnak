/*
  Warnings:

  - You are about to drop the column `credits` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `CreditTransaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Payout` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CreditTransaction" DROP CONSTRAINT "CreditTransaction_userId_fkey";

-- DropForeignKey
ALTER TABLE "Payout" DROP CONSTRAINT "Payout_doctorId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "credits",
ADD COLUMN     "age" INTEGER,
ADD COLUMN     "bloodType" TEXT,
ADD COLUMN     "weight" DOUBLE PRECISION;

-- DropTable
DROP TABLE "CreditTransaction";

-- DropTable
DROP TABLE "Payout";

-- DropEnum
DROP TYPE "PayoutStatus";

-- DropEnum
DROP TYPE "TransactionType";

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PDF',
    "status" TEXT NOT NULL DEFAULT 'مكتمل',
    "fileUrl" TEXT,
    "content" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "diagnosis" TEXT,
    "medications" JSONB NOT NULL,
    "instructions" TEXT,
    "followUpDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Conversation_doctorId_idx" ON "Conversation"("doctorId");

-- CreateIndex
CREATE INDEX "Conversation_patientId_idx" ON "Conversation"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_doctorId_patientId_key" ON "Conversation"("doctorId", "patientId");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Prescription_appointmentId_key" ON "Prescription"("appointmentId");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
