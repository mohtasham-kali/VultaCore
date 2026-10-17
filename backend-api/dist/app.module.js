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
            }),
            typeorm_1.TypeOrmModule.forRoot({
                type: (process.env.DATABASE_URL ? 'postgres' : 'sqlite'),
                url: process.env.DATABASE_URL,
                database: process.env.DATABASE_URL ? undefined : 'saas.sqlite',
                autoLoadEntities: true,
                synchronize: true,
                ssl: process.env.DATABASE_URL
                    ? { rejectUnauthorized: false }
                    : false,
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