export declare class Bot {
    id: string;
    name: string;
    type: 'general' | 'cyber';
    category: string;
    status: 'idle' | 'working' | 'completed';
    description: string;
    createdAt: Date;
}
