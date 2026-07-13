import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PlansModule } from './plans/plans.module';
import { LeadsModule } from './leads/leads.module';
import { ForumModule } from './forum/forum.module';
import { BotsModule } from './bots/bots.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ChatModule } from './chat/chat.module';
import { SettingsModule } from './settings/settings.module';
import { BillingModule } from './billing/billing.module';
import { EventsModule } from './events/events.module';

import * as fs from 'fs';

const staticModuleOptions = fs.existsSync(join(process.cwd(), 'out'))
  ? [ServeStaticModule.forRoot({ rootPath: join(process.cwd(), 'out') })]
  : [];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (): TypeOrmModuleOptions => {
        const dbUrl = process.env.DATABASE_URL;
        const isPostgres =
          dbUrl &&
          (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://'));

        if (isPostgres) {
          return {
            type: 'postgres',
            url: dbUrl,
            ssl: { rejectUnauthorized: false },
            autoLoadEntities: true,
            synchronize: true,
          };
        }

        // Resolve SQLite database file path
        let database = 'saas.sqlite';
        if (dbUrl && dbUrl.startsWith('sqlite:')) {
          // Strip 'sqlite:///' or 'sqlite://' or 'sqlite:' prefix
          database = dbUrl.replace(/^sqlite:\/\/\/?/, '');
        } else if (dbUrl) {
          database = dbUrl;
        }

        return {
          type: 'sqlite',
          database,
          autoLoadEntities: true,
          synchronize: true,
        };
      },
    }),
    UsersModule,
    PlansModule,
    LeadsModule,
    ForumModule,
    BotsModule,
    AnalyticsModule,
    NotificationsModule,
    ...staticModuleOptions,
    ScheduleModule.forRoot(),
    ChatModule,
    SettingsModule,
    BillingModule,
    EventsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
