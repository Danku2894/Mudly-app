import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateNotificationDto } from './dto/notification.dto';

@Controller('noti')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyNotifications(@Request() req: any) {
      const data = await this.notificationsService.getUserNotifications(req.user.id);
      return { success: true, data };
  }

  @Post('internal')
  async createInternal(@Body() body: CreateNotificationDto) {
      const data = await this.notificationsService.send(body);
      return { success: true, data, message: 'Notification sent' };
  }
}
