import { HttpService } from '@nestjs/axios';
import { Repository } from 'typeorm';
import { Post } from '../forum/entities/post.entity';
import { Comment } from '../forum/entities/comment.entity';
export declare class AnalyticsService {
    private readonly httpService;
    private postRepository;
    private commentRepository;
    constructor(httpService: HttpService, postRepository: Repository<Post>, commentRepository: Repository<Comment>);
    getUserAnalytics(userId: string): Promise<any>;
}
