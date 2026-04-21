import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ForumService } from './forum.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('forum')
export class ForumController {
  constructor(private readonly forumService: ForumService) {}

  @Post()
  create(@Body() createPostDto: CreatePostDto) {
    // Mock user for now - will be replaced by AuthGuard
    const mockUser = { id: 'mock-uuid' } as any;
    return this.forumService.createPost(createPostDto, mockUser);
  }

  @Get()
  findAll(@Query('type') type?: 'dev' | 'cyber') {
    return this.forumService.findAllPosts(type);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.forumService.findOnePost(id);
  }

  @Post(':id/like')
  like(@Param('id') id: string) {
    return this.forumService.likePost(id);
  }

  @Post(':id/comments')
  createComment(
    @Param('id') id: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    const mockUser = { id: 'mock-uuid' } as any;
    return this.forumService.createComment(id, createCommentDto, mockUser);
  }
}
