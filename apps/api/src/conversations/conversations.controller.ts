import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConversationsService } from './conversations.service';
import { UpdateContactInfoDto } from './dto/update-contact-info.dto';
import type { AuthenticatedRequest } from '../common/types';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get('contacts')
  getContacts(
    @Request() req: AuthenticatedRequest,
    @Query('platform') platform?: string,
    @Query('lifecycle') lifecycle?: string,
    @Query('search') search?: string,
    @Query('filter') filter?: string,
  ) {
    return this.conversationsService.getContacts(req.user.id, { platform, lifecycle, search, filter });
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  markAsRead(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.conversationsService.markAsRead(id, req.user.id);
  }

  @Patch(':id/archive')
  @HttpCode(HttpStatus.OK)
  archive(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.conversationsService.archiveConversation(id, req.user.id);
  }

  @Patch(':id/unarchive')
  @HttpCode(HttpStatus.OK)
  unarchive(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.conversationsService.unarchiveConversation(id, req.user.id);
  }

  @Patch(':id/contact-info')
  @HttpCode(HttpStatus.OK)
  updateContactInfo(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContactInfoDto,
  ) {
    return this.conversationsService.updateContactInfo(id, req.user.id, dto);
  }
}
