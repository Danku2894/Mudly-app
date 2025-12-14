import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import { UseGuards, UnauthorizedException } from '@nestjs/common';
import { CreateMessageDto, TypingDto, SeenMessageDto } from './dto/chat.dto';
import { AiService } from '../ai/ai.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
      private readonly chatService: ChatService,
      private readonly jwtService: JwtService,
      private readonly aiService: AiService
  ) {}

  async handleConnection(client: Socket) {
      try {
          const authHeader = client.handshake.headers.authorization; 
          const token = authHeader && authHeader.split(' ')[1];
          if (!token) throw new UnauthorizedException();
          
          const payload = this.jwtService.verify(token);
          client.data.user = payload;
          client.join(`user_${payload.sub}`);
          console.log(`Client connected: ${client.id}, User: ${payload.sub}`);
      } catch (error) {
          console.log('Unauthorized connection attempt');
          client.disconnect();
      }
  }

  handleDisconnect(client: Socket) {
      console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('message:send')
  async handleMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: CreateMessageDto) {
      const user = client.data.user;
      
      // 1. Toxic Check
      const toxicCheck = await this.aiService.detectToxic(payload.content);
      if (toxicCheck.score > 60) {
          client.emit('error', { message: 'Message blocked due to toxicity.' });
          return;
      }

      // 2. Save Message
      const message = await this.chatService.saveMessage(user.sub, payload.conversationId, payload.content, payload.images);

      // 3. Broadcast to Conversation Room (Assuming clients join room match convoId)
      // OR Broadcast to participants manually if we don't manage room joins perfectly
      // Let's emit to the conversation room. We need to insure users join convo room on FE logic or here.
      // For simplicity, let's emit to the room named conversationId.
      this.server.to(payload.conversationId).emit('message:new', message);
      
      // Also join sender to the room if not already? Usually client joins room on "Open Chat" event from FE.
  }
  
  @SubscribeMessage('conversation:join')
  handleJoinConversation(@ConnectedSocket() client: Socket, @MessageBody() conversationId: string) {
      client.join(conversationId);
      console.log(`User ${client.data.user.sub} joined room ${conversationId}`);
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(@ConnectedSocket() client: Socket, @MessageBody() payload: TypingDto) {
      client.to(payload.conversationId).emit('typing:start', { userId: client.data.user.sub, conversationId: payload.conversationId });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(@ConnectedSocket() client: Socket, @MessageBody() payload: TypingDto) {
      client.to(payload.conversationId).emit('typing:stop', { userId: client.data.user.sub, conversationId: payload.conversationId });
  }

  @SubscribeMessage('message:seen')
  async handleSeen(@ConnectedSocket() client: Socket, @MessageBody() payload: SeenMessageDto) {
      await this.chatService.markMessageAsSeen(client.data.user.sub, payload.messageId);
      client.to(payload.conversationId).emit('message:seen', { userId: client.data.user.sub, messageId: payload.messageId });
  }
}
