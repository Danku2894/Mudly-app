import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePostDto, GetFeedDto, CreateCommentDto } from './dto/post.dto';
import { PostTopic, Prisma, ReactionType } from '@prisma/client';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createPostDto: CreatePostDto) {
      const { content, images, topic } = createPostDto;
      
      // Mock AI Summary & Toxicity Check
      let summary = null;
      let isToxic = false;
      let toxicityScore = 0.0;

      if (content.length > 300) {
          summary = 'AI Summary: ' + content.substring(0, 50) + '...';
      }
      
      // internal mock logic for toxicity
      if (content.toLowerCase().includes('toxic')) {
          isToxic = true;
          toxicityScore = 0.9;
      }

      return this.prisma.post.create({
          data: {
              content,
              images: images || [],
              topic: topic || PostTopic.GENERAL,
              authorId: userId,
              summary,
              isToxic,
              toxicityScore,
          }
      });
  }

  async createComment(userId: string, createCommentDto: CreateCommentDto) {
      return this.prisma.comment.create({
          data: {
              content: createCommentDto.content,
              postId: createCommentDto.postId,
              authorId: userId,
          }
      });
      // TODO: Increment interactionScore of the post
  }

  async getFeed(dto: GetFeedDto) {
      const { cursor, limit = 10, sortBy = 'time', topic, zenMode } = dto;
      
      const where: any = {};
      
      if (topic) {
          where.topic = topic;
      }

      if (zenMode) {
          where.isToxic = false;
      }

      const orderBy: Prisma.PostOrderByWithRelationInput = sortBy === 'interaction' 
        ? { interactionScore: 'desc' } 
        : { createdAt: 'desc' };

      const posts = await this.prisma.post.findMany({
          take: Number(limit) + 1, // Get one extra to determine next cursor
          where,
          orderBy,
          cursor: cursor ? { id: cursor } : undefined,
          include: {
              author: {
                  select: { id: true, username: true, email: true, rank: true, avatar: true }
              },
              _count: {
                  select: { comments: true, reactions: true }
              }
          }
      });

      let nextCursor = null;
      if (posts.length > limit) {
          const nextItem = posts.pop();
          nextCursor = nextItem?.id;
      }

      return {
          data: posts,
          nextCursor,
      };
  }

  async findOne(id: string) {
      return this.prisma.post.findUnique({
          where: { id },
          include: {
              author: {
                  select: { id: true, email: true, rank: true, avatar: true }
              },
              comments: {
                  include: { author: { select: { id: true, email: true, avatar: true } } },
                  orderBy: { createdAt: 'desc' }
              },
              reactions: true,
              _count: {
                  select: { comments: true, reactions: true }
              }
          }
      });
  }

  async getUserPosts(userId: string) {
      return this.prisma.post.findMany({
          where: { authorId: userId },
          orderBy: { createdAt: 'desc' },
          include: {
              _count: { select: { comments: true, reactions: true } }
          }
      });
      // Pagination can be added later if needed
  }

  async update(id: string, userId: string, data: any) {
      const post = await this.prisma.post.findUnique({ where: { id } });
      if (!post) throw new Error('Post not found');
      if (post.authorId !== userId) throw new Error('Unauthorized');

      // Save history
      const historyEntry = {
          timestamp: new Date(),
          content: post.content,
          images: post.images,
      };

      const currentHistory = (post.editHistory as any[]) || [];
      
      return this.prisma.post.update({
          where: { id },
          data: {
              ...data,
              editHistory: [...currentHistory, historyEntry],
          }
      });
  }

  async delete(id: string, userId: string) {
      const post = await this.prisma.post.findUnique({ where: { id } });
      if (!post) throw new Error('Post not found');
      if (post.authorId !== userId) throw new Error('Unauthorized');

      return this.prisma.post.delete({ where: { id } });
  }

  async toggleReaction(postId: string, userId: string, type: 'LIKE' | 'LOVE' | 'LAUGH' | 'SAD' | 'ANGRY') {
       // Check if reaction exists
       const existingReaction = await this.prisma.reaction.findUnique({
           where: {
               authorId_postId: {
                   authorId: userId,
                   postId
               }
           }
       });

       if (existingReaction) {
           if (existingReaction.type === type) {
               // Remove reaction if same type
               await this.prisma.reaction.delete({
                   where: { id: existingReaction.id }
               });
               return { action: 'removed' };
           } else {
               // Update reaction type
               await this.prisma.reaction.update({
                   where: { id: existingReaction.id },
                   data: { type }
               });
               return { action: 'updated' };
           }
       } else {
           // Create new reaction
           await this.prisma.reaction.create({
               data: {
                   postId,
                   authorId: userId,
                   type
               }
           });
           return { action: 'created' };
       }
       // TODO: Update interactionScore
  }

}
