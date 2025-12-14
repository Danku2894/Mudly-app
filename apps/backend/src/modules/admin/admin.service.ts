import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UserStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getViolations(level: 'low' | 'high' = 'high') {
      const threshold = level === 'high' ? 0.8 : 0.5;
      
      const toxicPosts = await this.prisma.post.findMany({
          where: { toxicityScore: { gte: threshold }, isToxic: true },
          include: { author: true }
      });

      const toxicComments = await this.prisma.comment.findMany({
        where: { toxicityScore: { gte: threshold }, isToxic: true },
        include: { author: true }
    });

      return { posts: toxicPosts, comments: toxicComments };
  }

  async getUsersWarning() {
      // Logic: Users with points < 20 or banned status pending
      return this.prisma.user.findMany({
          where: { 
              OR: [
                  { points: { lt: 20 } },
                  { rank: { contains: 'Toxic', mode: 'insensitive' } } // Mock logic for rank name
              ]
          }
      });
  }

  async banUser(userId: string) {
      return this.prisma.user.update({
          where: { id: userId },
          data: { status: UserStatus.BANNED }
      });
  }

  async deletePost(postId: string) {
      // Cascade delete might be handled by DB or Prisma relation config
      // But manually: delete comments, reactions first if not set
      // Assuming ON DELETE CASCADE in Prisma or just try deleting
      const deleteComments = this.prisma.comment.deleteMany({ where: { postId } });
      const deleteReactions = this.prisma.reaction.deleteMany({ where: { postId } });
      const deletePost = this.prisma.post.delete({ where: { id: postId } });

      await this.prisma.$transaction([deleteComments, deleteReactions, deletePost]);
      return { success: true };
  }

  async adminComment(adminId: string, postId: string, content: string) {
      // Check if admin? Guard checks it.
      return this.prisma.comment.create({
          data: {
              content,
              postId,
              authorId: adminId,
              isToxic: false, // Admin is trusted
              toxicityScore: 0
          }
      });
  }

  async getStats() {
      const toxicCount = await this.prisma.post.count({ where: { isToxic: true } });
      const spamCount = 0; // Mock spam logic not implemented in detail yet
      
      const trending = await this.prisma.trendingTopic.findMany({ take: 5, orderBy: { count: 'desc' } });
      
      return {
          toxicLevel: { toxicPosts: toxicCount },
          spam: { spamCount },
          trending
      };
  }
}
