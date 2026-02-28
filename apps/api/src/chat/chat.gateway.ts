import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

import { PrismaService } from '../prisma/prisma.service';
import type { conversations, messages } from '@prisma/client';

interface JwtPayload {
  sub: number;
  email: string;
}

/**
 * WebSocket gateway for real-time messaging.
 *
 * Authentication:
 *   The frontend connects with:
 *     io('ws://localhost:3000', { auth: { token: '<JWT>' } })
 *   On connect the gateway verifies the JWT and joins the socket to the
 *   room `user:{userId}`.  Unauthenticated connections are rejected.
 *
 * Server → client events:
 *   'newMessage'      — a new inbound or outbound message
 *   'newConversation' — a brand-new conversation (first message from a contact)
 *   'conversations'   — response to 'getConversations'
 *   'messages'        — response to 'getMessages'
 *   'error'           — operational errors
 *
 * Client → server events:
 *   'getConversations'          — fetch all conversations for the user
 *   'getMessages' { conversationId } — fetch messages for one conversation
 *
 * Outbound replies go through the REST endpoint POST /telegram/reply, not WS.
 */
@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  afterInit() {
    this.logger.log('WebSocket gateway initialised');
  }

  // ── Connection lifecycle ──────────────────────────────────────────────────

  async handleConnection(client: Socket) {
    // Accept the JWT from any of the three common places socket.io clients use:
    //   1. io(url, { auth: { token } })          → client.handshake.auth.token
    //   2. io(url, { query: { token } })          → client.handshake.query.token
    //   3. custom header Authorization: Bearer …  → client.handshake.headers.authorization
    const token =
      (client.handshake.auth?.token as string | undefined) ??
      (client.handshake.query?.token as string | undefined) ??
      (client.handshake.headers?.authorization as string | undefined)?.replace(
        /^Bearer\s+/i,
        '',
      );

    if (!token) {
      // Log what the handshake actually contains so it is easy to spot the
      // mismatch between what the frontend sends and what we expect.
      this.logger.warn(
        `WS ${client.id}: no token found — disconnecting. ` +
          `handshake.auth keys: [${Object.keys(client.handshake.auth ?? {}).join(', ')}] | ` +
          `handshake.query keys: [${Object.keys(client.handshake.query ?? {}).join(', ')}] | ` +
          `authorization header present: ${!!client.handshake.headers?.authorization}`,
      );
      client.disconnect();
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      client.data.userId = payload.sub;
      await client.join(`user:${payload.sub}`);
      this.logger.log(`WS ${client.id}: authenticated as user ${payload.sub}`);
    } catch {
      this.logger.warn(`WS ${client.id}: invalid/expired token — disconnecting`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`WS ${client.id}: disconnected`);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private getUserId(client: Socket): number | null {
    const userId = client.data?.userId as number | undefined;
    return userId ?? null;
  }

  // ── Client → server handlers ──────────────────────────────────────────────

  /**
   * 'getConversations'
   * Returns all Telegram conversations owned by the authenticated user.
   */
  @SubscribeMessage('getConversations')
  async handleGetConversations(@ConnectedSocket() client: Socket) {
    const userId = this.getUserId(client);
    if (!userId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    try {
      const conversations = await this.prisma.conversations.findMany({
        where: {
          platform_account: { user_id: userId },
        },
        orderBy: { id: 'desc' },
      });
      client.emit('conversations', conversations);
    } catch (err) {
      client.emit('error', { message: (err as Error).message });
    }
  }

  /**
   * 'getMessages' { conversationId }
   * Returns messages for the given conversation after verifying ownership.
   */
  @SubscribeMessage('getMessages')
  async handleGetMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: number },
  ) {
    const userId = this.getUserId(client);
    if (!userId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    try {
      // Ownership check
      const conversation = await this.prisma.conversations.findFirst({
        where: {
          id: payload.conversationId,
          platform_account: { user_id: userId },
        },
      });

      if (!conversation) {
        client.emit('error', { message: 'Conversation not found' });
        return;
      }

      const messages = await this.prisma.messages.findMany({
        where: { conversation_id: payload.conversationId },
        orderBy: { timestamp: 'asc' },
      });
      client.emit('messages', messages);
    } catch (err) {
      client.emit('error', { message: (err as Error).message });
    }
  }

  // ── Server → client push helpers ─────────────────────────────────────────

  /** Push a new message to all sockets in the user's room. */
  emitNewMessage(userId: number, message: messages) {
    this.server.to(`user:${userId}`).emit('newMessage', message);
  }

  /** Push a new conversation to all sockets in the user's room. */
  emitNewConversation(userId: number, conversation: conversations) {
    this.server.to(`user:${userId}`).emit('newConversation', conversation);
  }
}
