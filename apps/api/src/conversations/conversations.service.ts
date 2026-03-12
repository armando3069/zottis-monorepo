import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateContactInfoDto } from './dto/update-contact-info.dto';

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getContacts(
    userId: number,
    filters: { platform?: string; lifecycle?: string; search?: string; filter?: string },
  ) {
    const where: Prisma.conversationsWhereInput = {
      platform_account: { user_id: userId },
    };

    if (filters.platform) where.platform = filters.platform;
    if (filters.lifecycle) where.lifecycle_status = filters.lifecycle;
    if (filters.filter === 'unread') where.unread_count = { gt: 0 };
    if (filters.search) {
      where.OR = [
        { contact_name: { contains: filters.search, mode: 'insensitive' } },
        { contact_username: { contains: filters.search, mode: 'insensitive' } },
        { contact_email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.conversations.findMany({
      where,
      orderBy: { last_message_at: { sort: 'desc', nulls: 'last' } },
      take: 500,
    });
  }

  async markAsRead(id: number, userId: number) {
    await this.getConversationForUser(id, userId);
    return this.prisma.conversations.update({
      where: { id },
      data: { unread_count: 0 },
    });
  }

  /**
   * Fetch a conversation with ownership verification.
   * Throws NotFoundException if the conversation doesn't exist or doesn't belong to the user.
   */
  async getConversationForUser(
    conversationId: number,
    userId: number,
    include?: { platform_account?: boolean; messages?: boolean },
  ) {
    const conversation = await this.prisma.conversations.findFirst({
      where: { id: conversationId, platform_account: { user_id: userId } },
      include,
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  async archiveConversation(id: number, userId: number) {
    await this.getConversationForUser(id, userId);
    return this.prisma.conversations.update({
      where: { id },
      data: { is_archived: true },
    });
  }

  async unarchiveConversation(id: number, userId: number) {
    await this.getConversationForUser(id, userId);
    return this.prisma.conversations.update({
      where: { id },
      data: { is_archived: false },
    });
  }

  async updateContactInfo(
    id: number,
    userId: number,
    dto: UpdateContactInfoDto,
  ) {
    await this.getConversationForUser(id, userId);

    const data: Prisma.conversationsUpdateInput = {};
    if (dto.lifecycleStatus !== undefined) data.lifecycle_status = dto.lifecycleStatus;
    if (dto.contactEmail    !== undefined) data.contact_email    = dto.contactEmail;
    if (dto.contactPhone    !== undefined) data.contact_phone    = dto.contactPhone;
    if (dto.contactCountry  !== undefined) data.contact_country  = dto.contactCountry;
    if (dto.contactLanguage !== undefined) data.contact_language = dto.contactLanguage;

    return this.prisma.conversations.update({ where: { id }, data });
  }
}
