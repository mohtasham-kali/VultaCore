import { Repository } from 'typeorm';
import { ChatMessage } from './entities/chat-message.entity';
import { User } from '../users/entities/user.entity';
export declare class ChatService {
    private readonly chatMessageRepository;
    constructor(chatMessageRepository: Repository<ChatMessage>);
    saveMessage(room: string, content: string, author: User): Promise<ChatMessage>;
    getMessagesByRoom(room: string, limit?: number): Promise<ChatMessage[]>;
}
