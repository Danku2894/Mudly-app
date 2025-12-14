import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCommentDto, GetCommentsDto } from './dto/comment.dto';
import { ReactionType } from '@prisma/client';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createCommentDto: CreateCommentDto) {
      const { content, postId } = createCommentDto;

      // 1. Toxic Scan (Mock)
      let isToxic = false;
      let toxicityScore = 0.0;
      if (content.toLowerCase().includes('toxic')) {
          isToxic = true;
          toxicityScore = 0.9;
      }
      if (toxicityScore > 0.8) {
          throw new Error('Comment blocked due to high toxicity score');
      }

      // 2. Detect Mentions
      const mentionRegex = /@(\w+)/g;
      const mentions = content.match(mentionRegex);
      if (mentions) {
          console.log('Mentions detected:', mentions);
          // TODO: Trigger Notification Service
      }

      return this.prisma.comment.create({
          data: {
              content,
              postId,
              authorId: userId,
              isToxic,
              toxicityScore
          },
          include: {
              author: { select: { id: true, username: true, email: true, avatar: true, rank: true } }
          }
      });
  }

  async findAllByPost(postId: string, dto: GetCommentsDto) {
      const { page = 1, limit = 10 } = dto;
      const skip = (page - 1) * limit;

      const comments = await this.prisma.comment.findMany({
          where: { postId },
          take: Number(limit),
          skip: Number(skip),
          orderBy: { createdAt: 'desc' },
          include: {
              author: { select: { id: true, username: true, email: true, avatar: true, rank: true } },
              reactions: true,
              _count: { select: { reactions: true } }
          }
      });

      return comments;
  }

  async toggleReaction(commentId: string, userId: string, type: 'LIKE' | 'LOVE' | 'LAUGH' | 'SAD' | 'ANGRY') {
      const existingReaction = await this.prisma.commentReaction.findUnique({
          where: {
              authorId_commentId: {
                  authorId: userId,
                  commentId
              }
          }
      });

      if (existingReaction) {
          if (existingReaction.type === type) {
              await this.prisma.commentReaction.delete({
                  where: { id: existingReaction.id }
              });
              return { action: 'removed' };
          } else {
              await this.prisma.commentReaction.update({
                  where: { id: existingReaction.id },
                  data: { type }
              });
              return { action: 'updated' };
          }
      } else {
          await this.prisma.commentReaction.create({
              data: {
                  commentId,
                  authorId: userId,
                  type: type as ReactionType 
              }
          });
          return { action: 'created' };
      }
  }
}
