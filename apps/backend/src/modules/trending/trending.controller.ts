import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { TrendingService } from './trending.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GenerateHashtagDto } from './dto/trending.dto';

@Controller()
export class TrendingController {
  constructor(private readonly trendingService: TrendingService) {}

  @Get('trending/topics')
  async getTopics() {
      const data = await this.trendingService.getTrendingTopics();
      return { success: true, data };
  }

  @Get('trending')
  async getTrending() {
      const topics = await this.trendingService.getTrendingTopics();
      const hashtags = await this.trendingService.getTrendingHashtags();
      return { success: true, data: { topics, hashtags } };
  }

  @Post('ai/hashtags')
  @UseGuards(JwtAuthGuard)
  async generateHashtags(@Body() body: GenerateHashtagDto) {
      const data = await this.trendingService.generateHashtags(body.content);
      return { success: true, data, message: 'Hashtags generated' };
  }
}
