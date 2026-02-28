import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { KnowledgeBaseService, IndexedFile } from './knowledge-base.service';
import { AskQuestionDto } from './dto/ask-question.dto';

interface AuthenticatedRequest extends Request {
  user: { id: number; email: string };
}

@Controller('knowledge')
@UseGuards(JwtAuthGuard)
export class KnowledgeBaseController {
  private readonly logger = new Logger(KnowledgeBaseController.name);

  constructor(private readonly knowledgeBaseService: KnowledgeBaseService) {}

  // ── POST /knowledge/upload ─────────────────────────────────────────────────

  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (_req, file, callback) => {
        const isPdf =
          file.mimetype === 'application/pdf' ||
          file.originalname.toLowerCase().endsWith('.pdf');
        if (!isPdf) {
          return callback(
            new BadRequestException('Only PDF files are allowed'),
            false,
          );
        }
        callback(null, true);
      },
      limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
    }),
  )
  async uploadPdf(
    @Request() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ success: boolean; chunks: number; file: string }> {
    if (!file) throw new BadRequestException('No file uploaded');

    const userId = req.user.id;
    try {
      const result = await this.knowledgeBaseService.indexPdfForUser(
        userId,
        file.buffer,
        file.originalname,
      );
      return { success: true, chunks: result.chunks, file: file.originalname };
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      this.logger.error(`[KB] Upload/index failed for user ${userId}`, e);
      throw new InternalServerErrorException('Failed to process PDF');
    }
  }

  // ── POST /knowledge/ask ────────────────────────────────────────────────────

  @Post('ask')
  @HttpCode(HttpStatus.OK)
  async ask(
    @Request() req: AuthenticatedRequest,
    @Body() dto: AskQuestionDto,
  ): Promise<{ answer: string; usedChunks?: string[] }> {
    const userId = req.user.id;
    try {
      return await this.knowledgeBaseService.answerQuestionForUser(
        userId,
        dto.question,
      );
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      this.logger.error(`[KB] Ask failed for user ${userId}`, e);
      throw new InternalServerErrorException('AI service unavailable');
    }
  }

  // ── GET /knowledge/files ───────────────────────────────────────────────────

  @Get('files')
  getFiles(@Request() req: AuthenticatedRequest): { files: IndexedFile[] } {
    return { files: this.knowledgeBaseService.getFilesForUser(req.user.id) };
  }

  // ── DELETE /knowledge/clear ────────────────────────────────────────────────

  @Delete('clear')
  @HttpCode(HttpStatus.OK)
  clear(@Request() req: AuthenticatedRequest): { success: boolean } {
    this.knowledgeBaseService.clearUserKnowledge(req.user.id);
    return { success: true };
  }
}
