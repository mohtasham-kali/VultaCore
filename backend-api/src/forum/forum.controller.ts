import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ForumService } from './forum.service';
import { UsersService } from '../users/users.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('forum')

export class ForumController {
  constructor(
    private readonly forumService: ForumService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  async create(@Body() createPostDto: CreatePostDto & { userId: string, email?: string }) {
    const { userId, email, ...dto } = createPostDto;
    const author = await this.usersService.findOrCreateUser(userId, email);
    return this.forumService.createPost(dto, author);
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
  async createComment(
    @Param('id') id: string,
    @Body() createCommentDto: CreateCommentDto & { userId: string, email?: string },
  ) {
    const { userId, email, ...dto } = createCommentDto;
    const author = await this.usersService.findOrCreateUser(userId, email);
    return this.forumService.createComment(id, dto, author);
  }

  @Post('comments/:commentId/like')
  likeComment(@Param('commentId') commentId: string) {
    return this.forumService.likeComment(commentId);
  }
}

