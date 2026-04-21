import { ForumService } from './forum.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
export declare class ForumController {
    private readonly forumService;
    constructor(forumService: ForumService);
    create(createPostDto: CreatePostDto): Promise<import("./entities/post.entity").Post>;
    findAll(type?: 'dev' | 'cyber'): Promise<import("./entities/post.entity").Post[]>;
    findOne(id: string): Promise<import("./entities/post.entity").Post>;
    like(id: string): Promise<import("./entities/post.entity").Post>;
    createComment(id: string, createCommentDto: CreateCommentDto): Promise<import("./entities/comment.entity").Comment>;
}
