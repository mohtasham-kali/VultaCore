import { ForumService } from './forum.service';
import { UsersService } from '../users/users.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
export declare class ForumController {
    private readonly forumService;
    private readonly usersService;
    constructor(forumService: ForumService, usersService: UsersService);
    create(createPostDto: CreatePostDto & {
        userId: string;
        email?: string;
    }): Promise<import("./entities/post.entity").Post>;
    findAll(type?: 'dev' | 'cyber'): Promise<import("./entities/post.entity").Post[]>;
    findOne(id: string): Promise<import("./entities/post.entity").Post>;
    like(id: string): Promise<import("./entities/post.entity").Post>;
    createComment(id: string, createCommentDto: CreateCommentDto & {
        userId: string;
        email?: string;
    }): Promise<import("./entities/comment.entity").Comment>;
}
