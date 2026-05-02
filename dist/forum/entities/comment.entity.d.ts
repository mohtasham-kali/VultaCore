import { User } from '../../users/entities/user.entity';
import { Post } from './post.entity';
export declare class Comment {
    id: string;
    content: string;
    author: User;
    post: Post;
    likes: number;
    createdAt: Date;
}
