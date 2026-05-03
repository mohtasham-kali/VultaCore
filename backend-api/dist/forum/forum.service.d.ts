import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { Comment } from './entities/comment.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { User } from '../users/entities/user.entity';
export declare class ForumService {
    private postRepository;
    private commentRepository;
    constructor(postRepository: Repository<Post>, commentRepository: Repository<Comment>);
    createPost(createPostDto: CreatePostDto, author: User): Promise<Post>;
    findAllPosts(type?: 'dev' | 'cyber'): Promise<Post[]>;
    findOnePost(id: string): Promise<Post>;
    likePost(id: string): Promise<Post>;
    createComment(postId: string, createCommentDto: CreateCommentDto, author: User): Promise<Comment>;
}
