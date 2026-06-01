export declare class ConversationMessage {
    id: string;
    userId: string;
    botId: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: Date;
}
