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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const csurf_1 = __importDefault(require("csurf"));
const app_module_1 = require("./app.module");
const bots_service_1 = require("./bots/bots.service");
const plans_service_1 = require("./plans/plans.service");
const users_service_1 = require("./users/users.service");
const createCookieParser = cookie_parser_1.default;
const createCsurf = csurf_1.default;
const csrfExemptPaths = new Set(['/api/billing/webhook']);
function getErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
function normalizePath(value) {
    return value.split('?')[0].replace(/\/+$/, '') || '/';
}
async function bootstrap() {
    console.log('[STARTUP] Current working directory:', process.cwd());
    console.log('[STARTUP] Application directory:', __dirname);
    try {
        const app = await core_1.NestFactory.create(app_module_1.AppModule, {
            rawBody: true,
        });
        const isProduction = process.env.NODE_ENV === 'production';
        const backendPort = Number(process.env.PORT || 3001);
        const frontendUrl = process.env.FRONTEND_URL?.trim();
        const allowedOrigins = [
            frontendUrl,
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://192.168.100.86:3000',
        ].filter((origin) => Boolean(origin));
        app.enableCors({
            origin: allowedOrigins,
            credentials: true,
            methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: [
                'Content-Type',
                'Authorization',
                'X-CSRF-Token',
                'X-XSRF-Token',
            ],
        });
        const cookieMiddleware = createCookieParser();
        app.use(cookieMiddleware);
        const csrfMiddleware = createCsurf({
            cookie: {
                key: '_csrf',
                httpOnly: true,
                secure: isProduction,
                sameSite: 'lax',
                path: '/',
            },
        });
        app.use((req, res, next) => {
            const requestPath = normalizePath(req.path || req.url || '/');
            const isOptionsRequest = req.method === 'OPTIONS';
            const isExemptPath = csrfExemptPaths.has(requestPath);
            if (isOptionsRequest || isExemptPath) {
                next();
                return;
            }
            csrfMiddleware(req, res, next);
        });
        app.use((req, res, next) => {
            try {
                const token = req.csrfToken();
                res.cookie('XSRF-TOKEN', token, {
                    httpOnly: false,
                    secure: isProduction,
                    sameSite: 'lax',
                    path: '/',
                });
                next();
            }
            catch (error) {
                next(error);
            }
        });
        const expressApp = app.getHttpAdapter().getInstance();
        expressApp.get('/api/csrf-token', (req, res) => {
            const token = req.csrfToken();
            res.cookie('XSRF-TOKEN', token, {
                httpOnly: false,
                secure: isProduction,
                sameSite: 'lax',
                path: '/',
            });
            res.json({
                csrfToken: token,
            });
        });
        app.setGlobalPrefix('api');
        await app.listen(backendPort, '0.0.0.0');
        console.log(`Application is running on: ${backendPort}`);
        const botsService = app.get(bots_service_1.BotsService);
        const existingBots = await botsService.findAll();
        if (existingBots.length === 0) {
            console.log('Empty database detected. Running auto-seed...');
            await botsService.create({
                name: 'Bug Scanner',
                type: 'general',
                status: 'idle',
                description: 'Scans your codebase for bugs.',
            });
            await botsService.create({
                name: 'Vulnerability Finder',
                type: 'cyber',
                status: 'working',
                description: 'Searching for CVEs.',
            });
            console.log('✅ Bots auto-seed successful.');
        }
        const plansService = app.get(plans_service_1.PlansService);
        const existingPlans = await plansService.findAll();
        if (existingPlans.length === 0) {
            console.log('No plans found. Running plans auto-seed...');
            await plansService.create({
                name: 'Free',
                price: 0,
                interval: 'monthly',
                features: ['Basic access'],
                variantId: 'free-tier',
            });
            await plansService.create({
                name: 'Standard',
                price: 19,
                interval: 'monthly',
                features: ['Standard access'],
                variantId: process.env.LS_VARIANT_STANDARD || '1820715',
            });
            await plansService.create({
                name: 'Premium',
                price: 49,
                interval: 'monthly',
                features: ['Premium access'],
                variantId: process.env.LS_VARIANT_PREMIUM || '1820708',
            });
            await plansService.create({
                name: 'Enterprise',
                price: 99,
                interval: 'monthly',
                features: ['Enterprise access'],
                variantId: process.env.LS_VARIANT_ENTERPRISE ||
                    process.env.LS_VARIANT_ENTERPISE ||
                    '1860093',
            });
            console.log('✅ Plans auto-seed successful.');
        }
        const adminEmail = process.env.ADMIN_EMAIL?.trim();
        if (adminEmail) {
            const usersService = app.get(users_service_1.UsersService);
            const adminUser = await usersService.findByEmail(adminEmail);
            if (adminUser && !adminUser.isAdmin) {
                await usersService.update(adminUser.id, {
                    isAdmin: true,
                });
                console.log(`✅ Auto-promoted ${adminEmail} to admin.`);
            }
            else if (adminUser) {
                console.log(`✅ Admin user (${adminEmail}) is already set.`);
            }
            else {
                console.warn(`⚠️ No user found for ADMIN_EMAIL=${adminEmail}.`);
            }
        }
    }
    catch (error) {
        const message = getErrorMessage(error);
        const stack = error instanceof Error && error.stack ? error.stack : message;
        const errorPath = path.join(process.cwd(), 'error_log.txt');
        fs.writeFileSync(errorPath, [`[STARTUP ERROR] ${new Date().toISOString()}`, stack, ''].join('\n'), 'utf8');
        console.error('[STARTUP ERROR]', stack);
        throw error;
    }
}
void bootstrap();
//# sourceMappingURL=main.js.map