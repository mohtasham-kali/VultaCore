import { User } from '../../users/entities/user.entity';
export declare class ChatMessage {
    id: string;
    content: string;
    room: string;
    createdAt: Date;
    author: User;
}
