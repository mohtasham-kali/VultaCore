import { User } from '../../users/entities/user.entity';
import { Comment } from './comment.entity';
export declare class Post {
    id: string;
    title: string;
    content: string;
    type: 'dev' | 'cyber';
    severity?: 'low' | 'medium' | 'high' | 'critical';
    author: User;
    tags: string[];
    likes: number;
    commentsCount: number;
    isResolved: boolean;
    aiResponded: boolean;
    comments: Comment[];
    createdAt: Date;
}
