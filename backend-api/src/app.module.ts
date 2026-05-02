import { Module } from '@nestjs/common';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PlansModule } from './plans/plans.module';
import { LeadsModule } from './leads/leads.module';
import { ForumModule } from './forum/forum.module';
import { BotsModule } from './bots/bots.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'saas.sqlite',
      autoLoadEntities: true,
      synchronize: true, // Only for development
    }),
    UsersModule,
    PlansModule,
    LeadsModule,
    ForumModule,
    BotsModule,
    AnalyticsModule,
    NotificationsModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'web-dashboard', 'out'),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
