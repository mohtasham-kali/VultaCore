import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { BotsService } from './bots.service';
import { BotsController } from './bots.controller';
import { Bot } from './entities/bot.entity';
import { ConversationMessage } from './entities/conversation-message.entity';
import { CommonModule } from '../common/common.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bot, ConversationMessage]),
    HttpModule,
    CommonModule,
    UsersModule,
  ],
  providers: [BotsService],
  controllers: [BotsController],
  exports: [BotsService],
})
export class BotsModule {}
