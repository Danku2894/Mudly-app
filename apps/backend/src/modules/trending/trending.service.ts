import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AiService } from '../ai/ai.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class TrendingService {
    private readonly logger = new Logger(TrendingService.name);

    constructor(
        private prisma: PrismaService,
        private aiService: AiService
    ) {}

    async getTrendingTopics() {
        return this.prisma.trendingTopic.findMany({
            orderBy: { count: 'desc' },
            take: 10
        });
    }

    async getTrendingHashtags() {
        return this.prisma.hashtag.findMany({
            orderBy: { count: 'desc' },
            take: 10
        });
    }

    async generateHashtags(content: string) {
        const tags = await this.aiService.generateHashtags(content);
        // Save tags to DB (Upsert)
        for (const tag of tags) {
            await this.prisma.hashtag.upsert({
                where: { name: tag },
                update: { count: { increment: 1 } },
                create: { name: tag, count: 1 }
            });
        }
        return tags;
    }

    @Cron('0 * * * *') // Hourly
    async handleTopicClustering() {
        this.logger.debug('Running Topic Clustering Worker...');
        // 1. Fetch recent posts
        const recentPosts = await this.prisma.post.findMany({
             where: { createdAt: { gte: new Date(Date.now() - 3600 * 1000) } },
             select: { content: true }
        });

        if (recentPosts.length === 0) return;

        // 2. Mock Clustering (Simple Word Frequency)
        const wordMap = new Map<string, number>();
        recentPosts.forEach(post => {
            const words = post.content.toLowerCase().split(/\s+/);
            words.forEach(w => {
                if (w.length > 4) {
                    wordMap.set(w, (wordMap.get(w) || 0) + 1);
                } 
            });
        });

        // 3. Save Top 5 words as Trending Topics
        const sorted = [...wordMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
        
        for (const [topic, count] of sorted) {
             await this.prisma.trendingTopic.upsert({
                 where: { name: topic },
                 update: { count },
                 create: { name: topic, count }
             });
        }
    }
}
