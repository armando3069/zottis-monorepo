-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_platform_account_id_fkey";

-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "contact_country" TEXT,
ADD COLUMN     "contact_email" TEXT,
ADD COLUMN     "contact_language" TEXT,
ADD COLUMN     "contact_phone" TEXT,
ADD COLUMN     "lifecycle_status" TEXT NOT NULL DEFAULT 'NEW_LEAD';

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_platform_account_id_fkey" FOREIGN KEY ("platform_account_id") REFERENCES "platform_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
