import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { AiService } from './ai.service';
import { ToxicDetectDto, SentimentDto, RewriteDto } from './dto/ai.dto';
import { BehaviorUpdateDto } from '../users/dto/user.dto';
import { UsersService } from '../users/users.service';

@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly usersService: UsersService
  ) {}

  @Post('toxic-detect')
  async toxicDetect(@Body() body: ToxicDetectDto) {
    const result = await this.aiService.detectToxic(body.text);
    return { success: true, data: result };
  }

  @Post('sentiment')
  async sentiment(@Body() body: SentimentDto) {
    const result = await this.aiService.analyzeSentiment(body.text);
    return { success: true, data: result };
  }

  @Post('rewrite')
  async rewrite(@Body() body: RewriteDto) {
    const result = await this.aiService.rewrite(body.text);
    return { success: true, data: result };
  }

  @Post('behavior-update')
  async updateBehavior(@Body() body: BehaviorUpdateDto) {
      try {
          const user = await this.usersService.updateBehavior(body.userId, body.pointsDelta);
          return { success: true, data: { userId: user.id, points: user.points, rank: user.rank }, message: 'Behavior score updated' };
      } catch (error) {
           throw new BadRequestException(error.message);
      }
  }
}
