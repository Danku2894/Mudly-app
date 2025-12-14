import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async findOne(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }
  
  async findOneById(id: string): Promise<User | null> {
      return this.prisma.user.findUnique({
          where: { id }
      });
  }

  // Get extended profile with stats
  async getProfile(id: string) {
      const user = await this.prisma.user.findUnique({
          where: { id },
          include: {
              _count: {
                  select: { posts: true, comments: true }
              }
          }
      });
      
      if (!user) return null;

      // Aggregations
      const posts = await this.prisma.post.findMany({ where: { authorId: id }, select: { topic: true, isToxic: true, toxicityScore: true } });
      const comments = await this.prisma.comment.findMany({ where: { authorId: id }, select: { isToxic: true, toxicityScore: true } });

      // Calculate Toxic Score Average
      let totalToxicScore = 0;
      let count = posts.length + comments.length;
      posts.forEach(p => totalToxicScore += p.toxicityScore);
      comments.forEach(c => totalToxicScore += c.toxicityScore);
      const avgToxicScore = count > 0 ? (totalToxicScore / count) : 0;

      // Sentiment Distribution (Mock based on toxicity for now, or random for demo)
      // Real sentiment would come from AI analysis field which we can add later
      const sentiment = [
          { name: 'Positive', value: 65, fill: '#10b981' }, // Emerald-500
          { name: 'Neutral', value: 25, fill: '#6366f1' },  // Indigo-500
          { name: 'Negative', value: 10, fill: '#ef4444' }, // Red-500
      ];

      // Top Topics
      const topicCounts: Record<string, number> = {};
      posts.forEach(p => {
          const t = p.topic;
          topicCounts[t] = (topicCounts[t] || 0) + 1;
      });
      
      const topTopics = Object.entries(topicCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({ name, count }));

      return {
          ...user,
          stats: {
              postsCount: user._count.posts,
              commentsCount: user._count.comments,
              avgToxicScore,
              sentiment,
              topTopics
          }
      };
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
      return this.prisma.user.update({
          where: { id },
          data
      });
  }

  async search(query: string) {
      return this.prisma.user.findMany({
          where: {
              OR: [
                  { username: { contains: query, mode: 'insensitive' } },
                  { email: { contains: query, mode: 'insensitive' } }
              ]
          },
          take: 5,
          select: { id: true, username: true, avatar: true, rank: true }
      });
  }

  async updateBehavior(userId: string, pointsDelta: number) {
      const user = await this.findOneById(userId);
      if (!user) {
          throw new Error('User not found');
      }

      const newPoints = user.points + pointsDelta;
      
      // Simple rank logic (example)
      let newRank = user.rank;
      if (newPoints > 1000) newRank = 'Elite Member';
      else if (newPoints > 500) newRank = 'Senior Member';
      else if (newPoints < 0) newRank = 'At Risk';

      return this.prisma.user.update({
          where: { id: userId },
          data: {
              points: newPoints,
              rank: newRank,
          }
      });
  }
}

