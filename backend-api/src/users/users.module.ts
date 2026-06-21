import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { PlanGuardService } from '../common/plan-guard.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService, PlanGuardService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
