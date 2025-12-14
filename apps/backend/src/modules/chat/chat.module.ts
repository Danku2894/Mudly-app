import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { PrismaService } from '../../database/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiModule } from '../ai/ai.module';

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
      AiModule
  ],
  providers: [ChatGateway, ChatService, PrismaService],
  controllers: [ChatController],
})
export class ChatModule {}
