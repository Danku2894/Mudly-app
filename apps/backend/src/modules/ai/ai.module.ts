import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiScheduleService } from './ai.schedule';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [AiController],
  providers: [AiService, AiScheduleService],
  exports: [AiService],
})
export class AiModule {}
