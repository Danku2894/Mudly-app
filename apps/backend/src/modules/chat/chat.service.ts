import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateConversationDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getUserConversations(userId: string) {
      return this.prisma.conversation.findMany({
          where: {
              participants: {
                  some: { userId }
              }
          },
          include: {
              participants: {
                  include: {
                      user: {
                          select: { id: true, email: true, avatar: true, rank: true }
                      }
                  }
              },
              messages: {
                  take: 1,
                  orderBy: { createdAt: 'desc' }
              }
          },
          orderBy: { updatedAt: 'desc' }
      });
  }

  async createConversation(userId: string, createConversationDto: CreateConversationDto) {
      const { participantIds } = createConversationDto;
      // Ensure current user is in participants
      const uniqueParticipants = Array.from(new Set([...participantIds, userId]));

      return this.prisma.conversation.create({
          data: {
              participants: {
                  create: uniqueParticipants.map(id => ({ userId: id }))
              }
          },
          include: {
              participants: true
          }
      });
  }

  async saveMessage(senderId: string, conversationId: string, content: string, images: string[] = []) {
      const message = await this.prisma.message.create({
          data: {
              senderId,
              conversationId,
              content,
              images
          },
          include: {
              sender: { select: { id: true, email: true, avatar: true } }
          }
      });

      // Update conversation timestamp
      await this.prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() }
      });

      return message;
  }

  async markMessageAsSeen(userId: string, messageId: string) {
      const message = await this.prisma.message.findUnique({ where: { id: messageId } });
      if (!message) return null;

      const seenBy = (message.seenBy as any[]) || [];
      if (!seenBy.includes(userId)) {
          seenBy.push(userId);
          await this.prisma.message.update({
              where: { id: messageId },
              data: { seenBy }
          });
      }
      return { messageId, userId };
  }
  
  async uploadImage(file: any) {
      // Mock upload to cloud storage
      return { url: `https://mock-storage.com/${file.originalname}` }; 
  }
}
