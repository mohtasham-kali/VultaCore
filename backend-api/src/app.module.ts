import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
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
      envFilePath: [
        join(process.cwd(), '.env'),
        join(process.cwd(), 'backend-api', '.env'),
        join(__dirname, '..', '.env'),
      ],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const dbUrl = process.env.DATABASE_URL;
        const isPostgres =
          dbUrl &&
          (dbUrl.startsWith('postgres://') ||
            dbUrl.startsWith('postgresql://'));
        const isMysql =
          dbUrl &&
          (dbUrl.startsWith('mysql://') ||
            dbUrl.startsWith('mariadb://'));
        const dbConfig: any = {
          autoLoadEntities: true,
          synchronize: true,
        };

        if (isPostgres) {
          dbConfig.type = 'postgres';
          dbConfig.url = dbUrl;
          dbConfig.ssl = { rejectUnauthorized: false };
        } else if (isMysql) {
          dbConfig.type = 'mysql';
          dbConfig.url = dbUrl;
          try {
            const parsed = new URL(dbUrl);
            const rawDb = (parsed.pathname || '').replace(/^\//, '');
            if (rawDb.toLowerCase() === 'database' || !rawDb) {
              console.error('================================================================');
              console.error('[Database] 🛑 CRITICAL CONFIGURATION ERROR:');
              console.error('[Database] Current database name in DATABASE_URL is "' + rawDb + '".');
              console.error('[Database] On Hostinger, database names always include your account prefix!');
              console.error('[Database] Example: u879979656_vultacore (check Hostinger -> Databases)');
              console.error('[Database] Update DATABASE_URL in Hostinger Environment Variables:');
              console.error('[Database]   mysql://' + (parsed.username || 'user') + ':PASSWORD@' + (parsed.host || '127.0.0.1:3306') + '/u879979656_YOUR_ACTUAL_DB_NAME');
              console.error('================================================================');
            }
          } catch (_) {}
        } else {
          try {
            require('sqlite3');
          } catch (sqliteErr) {
            console.error('================================================================');
            console.error('[Database] ⚠️ sqlite3 native library failed to load:', sqliteErr.message);
            console.error('[Database] 👉 On Hostinger or Cloud Linux, you can configure a free database:');
            console.error('[Database]    • Hostinger MySQL: DATABASE_URL=mysql://user:pass@127.0.0.1:3306/dbname');
            console.error('[Database]    • Cloud PostgreSQL (Neon/Supabase): DATABASE_URL=postgres://user:pass@host/dbname');
            console.error('================================================================');
          }
          dbConfig.type = 'sqlite';
          if (dbUrl && dbUrl.startsWith('sqlite:')) {
            // Remove 'sqlite:///' or 'sqlite://' or 'sqlite:'
            dbConfig.database = dbUrl.replace(/^sqlite:\/\/\/?/, '');
          } else {
            dbConfig.database = dbUrl || 'saas.sqlite';
          }
        }
        return dbConfig;
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
