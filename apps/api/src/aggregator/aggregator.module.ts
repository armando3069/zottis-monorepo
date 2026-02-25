import { Module } from '@nestjs/common';
import { AggregatorService } from './aggregator.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AggregatorService],
  exports: [AggregatorService], // 👈 îl exportăm ca să-l folosească TelegramService
})
export class AggregatorModule {}
