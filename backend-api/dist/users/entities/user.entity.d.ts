import { Post } from '../../forum/entities/post.entity';
import { Comment } from '../../forum/entities/comment.entity';
export declare class User {
    id: string;
    username: string;
    email: string;
    password: string;
    points: number;
    rank: string;
    posts: Post[];
    comments: Comment[];
}
