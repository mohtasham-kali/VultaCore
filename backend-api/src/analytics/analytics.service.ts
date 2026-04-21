import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../forum/entities/post.entity';
import { Comment } from '../forum/entities/comment.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
  ) {}

  async getUserAnalytics(userId: string): Promise<any> {
    // Fetch real data from DB for activity log
    const recentPosts = await this.postRepository.find({
      where: { author: { id: userId } },
      order: { createdAt: 'DESC' },
      take: 5,
    });
    const recentComments = await this.commentRepository.find({
      where: { author: { id: userId } },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const postCount = await this.postRepository.count({ where: { author: { id: userId } } });
    const commentCount = await this.commentRepository.count({ where: { author: { id: userId } } });

    // Combine recent actions for the UI
    const activityLog = [
      ...recentPosts.map(p => ({ type: 'post', title: p.title, date: p.createdAt, points: 50 })),
      ...recentComments.map(c => ({ type: 'comment', title: 'Comented on a post', date: c.createdAt, points: 10 })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

    // Prepare actions for Rust engine
    const actions = [
      ...Array(postCount).fill({ action_type: 'post_created', timestamp: Date.now(), points: 50 }),
      ...Array(commentCount).fill({ action_type: 'comment_created', timestamp: Date.now(), points: 10 }),
    ];

    try {
      const response = await firstValueFrom(
        this.httpService.post('http://localhost:5000/calculate', {
          user_id: userId,
          actions: actions.length > 0 ? actions : [{ action_type: 'session_start', timestamp: Date.now(), points: 5 }],
        }),
      );
      return { ...response.data, activityLog };
    } catch (error) {
      return {
        user_id: userId,
        total_points: (postCount * 50) + (commentCount * 10),
        rank_estimate: 'Syncing...',
        engagement_score: 0,
        activityLog,
        error: 'Rust Analytics Engine Offline',
      };
    }
  }
}
