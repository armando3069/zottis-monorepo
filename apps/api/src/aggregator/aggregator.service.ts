import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * @deprecated
 * AggregatorService was used in the single-bot era.
 * Message processing now happens directly in TelegramService.handleWebhookUpdate.
 * This service is kept to avoid removing AggregatorModule from the DI graph
 * but is no longer called anywhere.
 */
@Injectable()
export class AggregatorService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * @deprecated Use TelegramService.handleWebhookUpdate instead.
   */
  async processIncomingMessage(
    _platform: string,
    _chatId: string,
    _data: Record<string, unknown>,
  ): Promise<never> {
    throw new Error(
      'AggregatorService.processIncomingMessage is deprecated. ' +
        'Use TelegramService.handleWebhookUpdate instead.',
    );
  }
}
