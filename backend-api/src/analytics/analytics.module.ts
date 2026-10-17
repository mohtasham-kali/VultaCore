import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Post } from '../forum/entities/post.entity';
import { Comment } from '../forum/entities/comment.entity';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([Post, Comment]),
  ],
  providers: [AnalyticsService],
  controllers: [AnalyticsController],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
