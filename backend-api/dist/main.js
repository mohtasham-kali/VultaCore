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
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const fs = __importStar(require("fs"));
const app_module_1 = require("./app.module");
async function bootstrap() {
    try {
        const app = await core_1.NestFactory.create(app_module_1.AppModule, {
            rawBody: true,
        });
        const allowedOrigins = [
            'https://vultacore.techprogression.com',
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            process.env.APP_URL,
        ].filter(Boolean);
        app.enableCors({
            origin: (origin, callback) => {
                if (!origin || allowedOrigins.includes(origin)) {
                    callback(null, true);
                }
                else {
                    callback(new Error(`CORS blocked request from origin: ${origin}`));
                }
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'x-signature', 'apikey'],
        });
        app.setGlobalPrefix('api');
        const port = process.env.PORT || 3001;
        if (typeof port === 'string' && isNaN(Number(port))) {
            if (fs.existsSync(port)) {
                fs.unlinkSync(port);
            }
            await app.listen(port);
            fs.chmodSync(port, 0o666);
        }
        else {
            await app.listen(Number(port), '0.0.0.0');
        }
        console.log(`Application is running on: ${port}`);
        try {
            const { BotsService } = require('./bots/bots.service');
            const botsService = app.get(BotsService);
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
                console.log('✅ Auto-seed successful!');
            }
        }
        catch (seedError) {
            console.error('Auto-seed failed (server keeps running):', seedError?.message || seedError);
        }
    }
    catch (error) {
        fs.writeFileSync('error_log.txt', `[STARTUP ERROR] ${new Date().toISOString()}\n${error?.stack || error}\n`);
        throw error;
    }
}
void bootstrap();
//# sourceMappingURL=main.js.map