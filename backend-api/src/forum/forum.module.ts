import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ForumService } from './forum.service';
import { ForumController } from './forum.controller';
import { Post } from './entities/post.entity';
import { Comment } from './entities/comment.entity';
import { UsersModule } from '../users/users.module';

import { BotsModule } from '../bots/bots.module';
import { ForumSchedulerService } from './forum.scheduler';

@Module({
  imports: [TypeOrmModule.forFeature([Post, Comment]), UsersModule, BotsModule],

  providers: [ForumService, ForumSchedulerService],
  controllers: [ForumController],
  exports: [ForumService],
})
export class ForumModule {}
