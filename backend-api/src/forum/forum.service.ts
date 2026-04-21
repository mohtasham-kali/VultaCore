import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { Comment } from './entities/comment.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ForumService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
  ) {}

  async createPost(createPostDto: CreatePostDto, author: User): Promise<Post> {
    const post = this.postRepository.create({
      ...createPostDto,
      author,
    });
    return this.postRepository.save(post);
  }

  async findAllPosts(type?: 'dev' | 'cyber'): Promise<Post[]> {
    const query = this.postRepository.createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .loadRelationCountAndMap('post.commentsCount', 'post.comments');

    if (type) {
      query.where('post.type = :type', { type });
    }

    return query.orderBy('post.createdAt', 'DESC').getMany();
  }

  async findOnePost(id: string): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['author', 'comments', 'comments.author'],
    });

    if (!post) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }

    return post;
  }

  async likePost(id: string): Promise<Post> {
    const post = await this.findOnePost(id);
    post.likes += 1;
    return this.postRepository.save(post);
  }

  async createComment(postId: string, createCommentDto: CreateCommentDto, author: User): Promise<Comment> {
    const post = await this.findOnePost(postId);
    const comment = this.commentRepository.create({
      ...createCommentDto,
      post,
      author,
    });
    return this.commentRepository.save(comment) as any;
  }
}
