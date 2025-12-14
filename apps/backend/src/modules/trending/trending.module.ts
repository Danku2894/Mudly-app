import { Module } from '@nestjs/common';
import { TrendingService } from './trending.service';
import { TrendingController } from './trending.controller';
import { PrismaService } from '../../database/prisma.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [TrendingController],
  providers: [TrendingService, PrismaService],
})
export class TrendingModule {}
