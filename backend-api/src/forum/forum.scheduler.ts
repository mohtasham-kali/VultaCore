import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Post } from './entities/post.entity';
import { ForumService } from './forum.service';
import { BotsService } from '../bots/bots.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class ForumSchedulerService {
  private readonly logger = new Logger(ForumSchedulerService.name);

  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    private usersService: UsersService,
    private forumService: ForumService,
    private botsService: BotsService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleUnansweredPosts() {
    const fifteenMinutesAgo = new Date();
    fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);

    // Find posts older than 15 mins, with 0 comments, and no AI response yet
    const posts = await this.postRepository.find({
      where: {
        createdAt: LessThanOrEqual(fifteenMinutesAgo),
        commentsCount: 0,
        aiResponded: false,
      },
    });

    if (posts.length > 0) {
      this.logger.log(
        `Found ${posts.length} unanswered posts older than 15 minutes. Generating AI responses...`,
      );

      // Ensure we have a system AI user
      let systemUser = await this.usersService.findByUsername('System AI');
      if (!systemUser) {
        systemUser = await this.usersService.create({
          username: 'System AI',
          email: 'ai@vultacore.techprogression.com',
          password: 'auto-generated',
          isBot: true,
          rank: 'AI Assistant',
        });
      }

      // Find a general bot to execute the prompt
      const bots = await this.botsService.findAll('general');
      const aiBot = bots.find((b) => b.name === 'Bug Scanner') || bots[0];

      if (!aiBot) {
        this.logger.error('No AI bots available to generate response.');
        return;
      }

      for (const post of posts) {
        try {
          const prompt = `Please provide a helpful, detailed, and professional response to this forum post. Title: "${post.title}". Content: "${post.content}"`;

          this.logger.log(`Generating AI response for post ID: ${post.id}`);
          const aiResponse = await this.botsService.executeBot(
            aiBot.id,
            prompt,
            systemUser.id,
          );

          // Guard: skip if AI returned an error or empty content
          const content: string | undefined =
            typeof aiResponse?.response === 'string'
              ? aiResponse.response.trim()
              : undefined;

          if (!content || aiResponse?.error) {
            this.logger.warn(
              `AI response was empty or errored for post ${post.id}. ` +
              `Reason: ${aiResponse?.error ?? 'empty response'}. Skipping comment.`,
            );
            // Mark as responded so we don't retry indefinitely when AI is down
            post.aiResponded = true;
            await this.postRepository.save(post);
            continue;
          }

          await this.forumService.createComment(
            post.id,
            { content },
            systemUser,
          );

          // Mark post as responded to by AI
          post.aiResponded = true;
          await this.postRepository.save(post);

          this.logger.log(`Successfully replied to post ID: ${post.id}`);
        } catch (error) {
          this.logger.error(
            `Failed to generate AI response for post ${post.id}:`,
            error,
          );
        }
      }
    }
  }
}
