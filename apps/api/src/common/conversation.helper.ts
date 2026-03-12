import type { messages } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';

/**
 * Stamps the conversation row with the denormalized last-message preview and,
 * for incoming client messages, atomically increments the unread counter.
 *
 * Call this immediately after every `prisma.messages.create()` so the inbox
 * can display the latest message and timestamp without fetching messages.
 *
 * Rules:
 *   sender_type === 'client'  → increment unread_count
 *   sender_type === 'bot'     → leave unread_count unchanged
 */
export async function updateConversationLastMessage(
  prisma: PrismaService,
  message: messages,
): Promise<void> {
  if (!message.conversation_id) return;

  const isIncoming = message.sender_type === 'client';

  await prisma.conversations.update({
    where: { id: message.conversation_id },
    data: {
      last_message_text:        message.text ?? null,
      last_message_at:          message.timestamp ?? message.created_at,
      last_message_sender_type: message.sender_type,
      ...(isIncoming && { unread_count: { increment: 1 } }),
      // Auto-unarchive when the contact writes back
      ...(isIncoming && { is_archived: false }),
    },
  });
}
