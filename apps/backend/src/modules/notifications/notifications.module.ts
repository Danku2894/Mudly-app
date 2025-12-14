import { Module, Global } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { IsNotificationGateway } from './notifications.gateway';
import { PrismaService } from '../../database/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global() // Make global so other modules can inject NotificationsService easily
@Module({
  imports: [
      JwtModule.registerAsync({
          imports: [ConfigModule],
          useFactory: async (configService: ConfigService) => ({
              secret: configService.get<string>('JWT_SECRET'),
              signOptions: { expiresIn: '15m' },
          }),
          inject: [ConfigService],
      }),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, IsNotificationGateway, PrismaService],
  exports: [NotificationsService]
})
export class NotificationsModule {}
