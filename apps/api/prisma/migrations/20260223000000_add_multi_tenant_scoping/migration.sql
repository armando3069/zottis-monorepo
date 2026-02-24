-- ============================================================
-- Migration: add_multi_tenant_scoping
--
-- Changes:
--   1. Drop orphaned conversations that have no platform_account
--      (dev-only data cleanup — safe to lose in local dev).
--   2. Make conversations.platform_account_id NOT NULL.
--   3. Drop old unique constraint [external_chat_id, platform].
--   4. Add new unique constraint [external_chat_id, platform_account_id].
--   5. Add unique constraint on platform_accounts
--      [user_id, platform, external_app_id].
-- ============================================================

-- Step 1: Remove orphaned rows so the NOT NULL constraint can be applied.
DELETE FROM "messages"
WHERE conversation_id IN (
  SELECT id FROM "conversations" WHERE platform_account_id IS NULL
);

DELETE FROM "conversations"
WHERE platform_account_id IS NULL;

-- Step 2: Make platform_account_id required.
ALTER TABLE "conversations"
  ALTER COLUMN "platform_account_id" SET NOT NULL;

-- Step 3: Drop the old platform-level unique constraint.
DROP INDEX IF EXISTS "conversations_external_chat_id_platform_key";

-- Step 4: Add per-bot unique constraint (correct multi-tenant boundary).
CREATE UNIQUE INDEX "conversations_external_chat_id_platform_account_id_key"
  ON "conversations"("external_chat_id", "platform_account_id");

-- Step 5: Add unique constraint on platform_accounts so we can
--         upsert by (user_id, platform, external_app_id).
CREATE UNIQUE INDEX "platform_accounts_user_id_platform_external_app_id_key"
  ON "platform_accounts"("user_id", "platform", "external_app_id");
