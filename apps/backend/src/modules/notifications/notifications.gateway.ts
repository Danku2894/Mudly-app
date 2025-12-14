import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'notifications' 
})
@Injectable()
export class IsNotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
      try {
          const authHeader = client.handshake.headers.authorization;
          const token = authHeader && authHeader.split(' ')[1];
          if (!token) throw new UnauthorizedException();
          
          const payload = this.jwtService.verify(token);
          client.data.user = payload;
          client.join(`user_${payload.sub}`);
          console.log(`Notification Client connected: ${client.id}, User: ${payload.sub}`);
      } catch (error) {
          console.log('Unauthorized notification connection attempt');
          client.disconnect();
      }
  }

  handleDisconnect(client: Socket) {
      console.log(`Notification Client disconnected: ${client.id}`);
  }

  sendToUser(userId: string, event: string, data: any) {
      this.server.to(`user_${userId}`).emit(event, data);
  }
}
