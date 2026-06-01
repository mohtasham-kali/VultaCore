"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const chat_service_1 = require("./chat.service");
const users_service_1 = require("../users/users.service");
let ChatGateway = class ChatGateway {
    chatService;
    usersService;
    server;
    constructor(chatService, usersService) {
        this.chatService = chatService;
        this.usersService = usersService;
    }
    afterInit(server) {
        console.log('WebSocket Chat Gateway Initialized');
    }
    handleConnection(client, ...args) {
        console.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        console.log(`Client disconnected: ${client.id}`);
    }
    async handleJoinRoom(client, room) {
        client.join(room);
        console.log(`Client ${client.id} joined room: ${room}`);
        const history = await this.chatService.getMessagesByRoom(room, 50);
        client.emit('chatHistory', history);
        return { event: 'joinedRoom', data: room };
    }
    handleLeaveRoom(client, room) {
        client.leave(room);
        console.log(`Client ${client.id} left room: ${room}`);
        return { event: 'leftRoom', data: room };
    }
    async handleSendMessage(client, payload) {
        try {
            const author = await this.usersService.findOrCreateUser(payload.userId, payload.email);
            const savedMessage = await this.chatService.saveMessage(payload.room, payload.content, author);
            this.server.to(payload.room).emit('newMessage', savedMessage);
            return { event: 'messageSent', data: true };
        }
        catch (error) {
            console.error('Error sending message:', error);
            client.emit('error', 'Failed to send message');
        }
    }
    handleSubscribeToUserEvents(client, userId) {
        const userRoom = `user_events_${userId}`;
        client.join(userRoom);
        console.log(`Client ${client.id} listening for events on: ${userRoom}`);
    }
    notifyUserSubscriptionUpdated(userId, newRank) {
        const userRoom = `user_events_${userId}`;
        console.log(`📡 Emitting subscriptionUpdated to ${userRoom} -> ${newRank}`);
        this.server.to(userRoom).emit('subscriptionUpdated', { newRank });
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinRoom'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveRoom'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleLeaveRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('sendMessage'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleSendMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribeToUserEvents'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleSubscribeToUserEvents", null);
exports.ChatGateway = ChatGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    }),
    __metadata("design:paramtypes", [chat_service_1.ChatService,
        users_service_1.UsersService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map