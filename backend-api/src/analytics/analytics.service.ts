import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../forum/entities/post.entity';
import { Comment } from '../forum/entities/comment.entity';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
  ) {}

  async getUserAnalytics(userId: string): Promise<any> {
    // 1. Fetch user's posts & comments from DB
    const allUserPosts = await this.postRepository.find({
      where: { author: { id: userId } },
      order: { createdAt: 'DESC' },
    });

    const allUserComments = await this.commentRepository.find({
      where: { author: { id: userId } },
      order: { createdAt: 'DESC' },
    });

    const postCount = allUserPosts.length;
    const commentCount = allUserComments.length;

    // 2. Activity log from real DB records
    const activityLog = [
      ...allUserPosts.slice(0, 10).map((p) => ({
        type: 'post' as const,
        title: p.title || 'Untitled Post',
        date: p.createdAt ? p.createdAt.toISOString() : new Date().toISOString(),
        points: 50,
      })),
      ...allUserComments.slice(0, 10).map((c) => ({
        type: 'comment' as const,
        title: c.content
          ? `Comment: "${c.content.slice(0, 45)}${c.content.length > 45 ? '…' : ''}"`
          : 'Commented on a post',
        date: c.createdAt ? c.createdAt.toISOString() : new Date().toISOString(),
        points: 10,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);

    // 3. Real 7-day temporal breakdown from user's actual activity timestamps
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const temporalData = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0).getTime();
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();

      const dayPosts = allUserPosts.filter((p) => {
        const time = new Date(p.createdAt).getTime();
        return time >= startOfDay && time <= endOfDay;
      }).length;

      const dayComments = allUserComments.filter((c) => {
        const time = new Date(c.createdAt).getTime();
        return time >= startOfDay && time <= endOfDay;
      }).length;

      // 50 pts per post, 10 pts per comment
      const dailyPoints = (dayPosts * 50) + (dayComments * 10);
      temporalData.push({
        name: dayNames[d.getDay()],
        value: dailyPoints,
      });
    }

    // 4. Calculate real total points
    const totalPoints = (postCount * 50) + (commentCount * 10);

    // 5. Calculate real rank estimate
    let rankEstimate = 'Recruit';
    if (totalPoints >= 1000) rankEstimate = 'Grandmaster';
    else if (totalPoints >= 500) rankEstimate = 'Master';
    else if (totalPoints >= 250) rankEstimate = 'Diamond';
    else if (totalPoints >= 100) rankEstimate = 'Platinum';
    else if (totalPoints >= 50) rankEstimate = 'Gold';
    else if (totalPoints >= 20) rankEstimate = 'Silver';

    // 6. Calculate real engagement score (percentage of active days or interaction density)
    const activeDaysCount = temporalData.filter((d) => d.value > 0).length;
    const engagementScore = Math.min(100, Math.round((activeDaysCount / 7) * 100) || (totalPoints > 0 ? 25 : 0));

    // 7. Calculate real completion rate (% of resolved posts, or minimum 70% if active)
    const resolvedPosts = allUserPosts.filter((p) => p.isResolved).length;
    const completionRate =
      postCount > 0
        ? Math.round((resolvedPosts / postCount) * 100)
        : totalPoints > 0
        ? 100
        : 0;

    // 8. Attempt Rust Analytics Engine if running, otherwise use the real DB-calculated stats
    try {
      const actions = [
        ...allUserPosts.map((p) => ({
          action_type: 'post_created',
          timestamp: new Date(p.createdAt).getTime(),
          points: 50,
        })),
        ...allUserComments.map((c) => ({
          action_type: 'comment_created',
          timestamp: new Date(c.createdAt).getTime(),
          points: 10,
        })),
      ];

      const response = await firstValueFrom(
        this.httpService.post('http://127.0.0.1:5000/calculate', {
          user_id: userId,
          actions: actions.length > 0 ? actions : [{ action_type: 'session_start', timestamp: Date.now(), points: 5 }],
        }),
      );
      return {
        ...response.data,
        total_points: response.data?.total_points || totalPoints,
        rank_estimate: response.data?.rank_estimate || rankEstimate,
        engagement_score: response.data?.engagement_score || engagementScore,
        completion_rate: completionRate,
        activityLog,
        temporalData,
      };
    } catch (_) {
      // Rust Engine not responding — return real TypeORM database calculation
      return {
        user_id: userId,
        total_points: totalPoints,
        rank_estimate: rankEstimate,
        engagement_score: engagementScore,
        completion_rate: completionRate,
        activityLog,
        temporalData,
      };
    }
  }
}
