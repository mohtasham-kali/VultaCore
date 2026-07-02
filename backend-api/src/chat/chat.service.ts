import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from './entities/chat-message.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
  ) {}

  async saveMessage(
    room: string,
    content: string,
    author: User,
  ): Promise<ChatMessage> {
    const message = this.chatMessageRepository.create({
      room,
      content,
      author,
    });
    return this.chatMessageRepository.save(message);
  }

  async getMessagesByRoom(
    room: string,
    limit: number = 50,
  ): Promise<ChatMessage[]> {
    return this.chatMessageRepository
      .find({
        where: { room },
        order: { createdAt: 'DESC' },
        take: limit,
        relations: ['author'],
      })
      .then((messages) => messages.reverse()); // Reverse to get chronological order
  }
}
