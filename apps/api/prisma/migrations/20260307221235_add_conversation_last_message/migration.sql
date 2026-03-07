-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "last_message_at" TIMESTAMP(3),
ADD COLUMN     "last_message_sender_type" TEXT,
ADD COLUMN     "last_message_text" TEXT;
