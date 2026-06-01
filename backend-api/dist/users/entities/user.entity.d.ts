import { Post } from '../../forum/entities/post.entity';
import { Comment } from '../../forum/entities/comment.entity';
import { Plan } from '../../plans/entities/plan.entity';
export declare class User {
    id: string;
    username: string;
    email: string;
    password: string;
    points: number;
    rank: string;
    isBot: boolean;
    isAdmin: boolean;
    plan: Plan;
    posts: Post[];
    comments: Comment[];
    notifications: any[];
}
