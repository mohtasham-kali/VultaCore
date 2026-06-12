import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { ForumService } from './forum.service';
import { BotsService } from '../bots/bots.service';
import { UsersService } from '../users/users.service';
export declare class ForumSchedulerService {
    private postRepository;
    private usersService;
    private forumService;
    private botsService;
    private readonly logger;
    constructor(postRepository: Repository<Post>, usersService: UsersService, forumService: ForumService, botsService: BotsService);
    handleUnansweredPosts(): Promise<void>;
}
