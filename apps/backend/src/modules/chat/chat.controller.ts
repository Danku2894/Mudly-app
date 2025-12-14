import { Controller, Get, Post, UseGuards, Request, UploadedFile, UseInterceptors, Body } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateConversationDto } from './dto/chat.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(JwtAuthGuard)
  @Get('conversations')
  async getConversations(@Request() req: any) {
      const data = await this.chatService.getUserConversations(req.user.id);
      return { success: true, data };
  }
  
  @UseGuards(JwtAuthGuard)
  @Post('conversations')
  async createConversation(@Request() req: any, @Body() body: CreateConversationDto) {
      const data = await this.chatService.createConversation(req.user.id, body);
      return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: any) {
      const result = await this.chatService.uploadImage(file);
      return { success: true, data: result };
  }
}
