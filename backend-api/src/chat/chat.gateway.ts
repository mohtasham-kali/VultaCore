import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { UsersService } from '../users/users.service';

@WebSocketGateway({
  cors: {
    origin: '*', // For production, replace with exact dashboard & capacitor domains
  },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly usersService: UsersService,
  ) {}

  afterInit(server: Server) {
    console.log('WebSocket Chat Gateway Initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() room: string, // e.g. 'dev' or 'cyber'
  ) {
    client.join(room);
    console.log(`Client ${client.id} joined room: ${room}`);

    // Optionally: fetch previous messages and send them specifically to this user
    const history = await this.chatService.getMessagesByRoom(room, 50);
    client.emit('chatHistory', history);

    return { event: 'joinedRoom', data: room };
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() room: string,
  ) {
    client.leave(room);
    console.log(`Client ${client.id} left room: ${room}`);
    return { event: 'leftRoom', data: room };
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { room: string; content: string; userId: string; email?: string },
  ) {
    try {
      const author = await this.usersService.findOrCreateUser(
        payload.userId,
        payload.email,
      );
      const savedMessage = await this.chatService.saveMessage(
        payload.room,
        payload.content,
        author,
      );
      this.server.to(payload.room).emit('newMessage', savedMessage);
      return { event: 'messageSent', data: true };
    } catch (error) {
      console.error('Error sending message:', error);
      client.emit('error', 'Failed to send message');
    }
  }

  // --- REVENUECAT / USER EVENT LOGIC --- //

  @SubscribeMessage('subscribeToUserEvents')
  handleSubscribeToUserEvents(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId: string,
  ) {
    // We create a unique room for this specific user to receive private system notifications
    const userRoom = `user_events_${userId}`;
    client.join(userRoom);
    console.log(`Client ${client.id} listening for events on: ${userRoom}`);
  }

  // Public method called by your RevenueCat Webhook Controller
  notifyUserSubscriptionUpdated(userId: string, newRank: string) {
    const userRoom = `user_events_${userId}`;
    console.log(`📡 Emitting subscriptionUpdated to ${userRoom} -> ${newRank}`);
    this.server.to(userRoom).emit('subscriptionUpdated', { newRank });
  }
}
