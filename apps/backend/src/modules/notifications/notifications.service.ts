import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { IsNotificationGateway } from './notifications.gateway';
import { CreateNotificationDto, NotificationType } from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
      private prisma: PrismaService,
      private notificationGateway: IsNotificationGateway
  ) {}

  async send(data: CreateNotificationDto) {
      // 1. Save to DB
      const notification = await this.prisma.notification.create({
          data: {
              userId: data.userId,
              type: data.type as any, // Enum mapping might need explicit cast if mismatched types exist usually harmless here
              content: data.content,
              metadata: data.metadata || {}
          }
      });

      // 2. Emit via WS
      this.notificationGateway.sendToUser(data.userId, 'notification:new', notification);
      
      return notification;
  }

  async getUserNotifications(userId: string) {
      return this.prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 20
      });
  }

  // Helper method for other modules to call easily
  async notify(userId: string, type: NotificationType, content: string, metadata?: any) {
      return this.send({ userId, type, content, metadata });
  }
}
