import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { UsersService } from '../users/users.service';
export declare class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly chatService;
    private readonly usersService;
    server: Server;
    constructor(chatService: ChatService, usersService: UsersService);
    afterInit(server: Server): void;
    handleConnection(client: Socket, ...args: any[]): void;
    handleDisconnect(client: Socket): void;
    handleJoinRoom(client: Socket, room: string): Promise<{
        event: string;
        data: string;
    }>;
    handleLeaveRoom(client: Socket, room: string): {
        event: string;
        data: string;
    };
    handleSendMessage(client: Socket, payload: {
        room: string;
        content: string;
        userId: string;
        email?: string;
    }): Promise<{
        event: string;
        data: boolean;
    } | undefined>;
    handleSubscribeToUserEvents(client: Socket, userId: string): void;
    notifyUserSubscriptionUpdated(userId: string, newRank: string): void;
}
