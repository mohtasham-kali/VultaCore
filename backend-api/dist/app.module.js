"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const path_1 = require("path");
const serve_static_1 = require("@nestjs/serve-static");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const users_module_1 = require("./users/users.module");
const plans_module_1 = require("./plans/plans.module");
const leads_module_1 = require("./leads/leads.module");
const forum_module_1 = require("./forum/forum.module");
const bots_module_1 = require("./bots/bots.module");
const analytics_module_1 = require("./analytics/analytics.module");
const notifications_module_1 = require("./notifications/notifications.module");
const chat_module_1 = require("./chat/chat.module");
const settings_module_1 = require("./settings/settings.module");
const billing_module_1 = require("./billing/billing.module");
const events_module_1 = require("./events/events.module");
const fs = __importStar(require("fs"));
const staticModuleOptions = fs.existsSync((0, path_1.join)(process.cwd(), 'out'))
    ? [serve_static_1.ServeStaticModule.forRoot({ rootPath: (0, path_1.join)(process.cwd(), 'out') })]
    : [];
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: [
                    (0, path_1.join)(process.cwd(), '.env'),
                    (0, path_1.join)(process.cwd(), 'backend-api', '.env'),
                    (0, path_1.join)(__dirname, '..', '.env'),
                ],
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                useFactory: () => {
                    const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
                    const isPostgres = dbUrl &&
                        (dbUrl.startsWith('postgres://') ||
                            dbUrl.startsWith('postgresql://'));
                    const isMysql = dbUrl &&
                        (dbUrl.startsWith('mysql://') ||
                            dbUrl.startsWith('mariadb://'));
                    const dbConfig = {
                        autoLoadEntities: true,
                        synchronize: true,
                    };
                    if (isPostgres) {
                        dbConfig.type = 'postgres';
                        const sanitized = dbUrl.replace(/^(postgres(?:ql)?:\/\/[^:]+:)(.*)(@[^@]+)$/, (_m, prefix, password, hostPart) => {
                            const encodedPassword = encodeURIComponent(decodeURIComponent(password));
                            return `${prefix}${encodedPassword}${hostPart}`;
                        });
                        try {
                            const parsed = new URL(sanitized);
                            dbConfig.host = parsed.hostname;
                            dbConfig.port = parseInt(parsed.port || '5432', 10);
                            dbConfig.username = decodeURIComponent(parsed.username);
                            dbConfig.password = decodeURIComponent(parsed.password);
                            dbConfig.database = parsed.pathname.replace(/^\//, '') || 'postgres';
                            console.log(`[Database] 🚀 Connecting to PostgreSQL/Supabase at ${dbConfig.host}:${dbConfig.port} (db: ${dbConfig.database}, user: ${dbConfig.username})`);
                        }
                        catch (_) {
                            dbConfig.url = sanitized;
                        }
                        dbConfig.ssl = { rejectUnauthorized: false };
                    }
                    else if (isMysql) {
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
                        }
                        catch (_) { }
                    }
                    else {
                        try {
                            require('sqlite3');
                        }
                        catch (sqliteErr) {
                            console.error('================================================================');
                            console.error('[Database] ⚠️ sqlite3 native library failed to load:', sqliteErr.message);
                            console.error('[Database] 👉 On Hostinger or Cloud Linux, you can configure a free database:');
                            console.error('[Database]    • Hostinger MySQL: DATABASE_URL=mysql://user:pass@127.0.0.1:3306/dbname');
                            console.error('[Database]    • Cloud PostgreSQL (Neon/Supabase): DATABASE_URL=postgres://user:pass@host/dbname');
                            console.error('================================================================');
                        }
                        dbConfig.type = 'sqlite';
                        if (dbUrl && dbUrl.startsWith('sqlite:')) {
                            dbConfig.database = dbUrl.replace(/^sqlite:\/\/\/?/, '');
                        }
                        else {
                            dbConfig.database = dbUrl || 'saas.sqlite';
                        }
                    }
                    return dbConfig;
                },
            }),
            users_module_1.UsersModule,
            plans_module_1.PlansModule,
            leads_module_1.LeadsModule,
            forum_module_1.ForumModule,
            bots_module_1.BotsModule,
            analytics_module_1.AnalyticsModule,
            notifications_module_1.NotificationsModule,
            ...staticModuleOptions,
            schedule_1.ScheduleModule.forRoot(),
            chat_module_1.ChatModule,
            settings_module_1.SettingsModule,
            billing_module_1.BillingModule,
            events_module_1.EventsModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map