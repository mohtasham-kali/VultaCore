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
        app.enableCors();
        app.setGlobalPrefix('api');
        const port = process.env.PORT || 3001;
        await app.listen(port);
        console.log(`Application is running on: ${port}`);
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
            console.log('✅ Bots Auto-seed successful!');
        }
        const { PlansService } = require('./plans/plans.service');
        const plansService = app.get(PlansService);
        const existingPlans = await plansService.findAll();
        if (existingPlans.length === 0) {
            console.log('No plans found. Running auto-seed for Plans...');
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
                variantId: process.env.LS_VARIANT_ENTERPRISE || process.env.LS_VARIANT_ENTERPISE || '1860093',
            });
            console.log('✅ Plans auto-seeded!');
        }
        const adminEmail = process.env.ADMIN_EMAIL;
        if (adminEmail) {
            const { UsersService } = require('./users/users.service');
            const usersService = app.get(UsersService);
            const adminUser = await usersService.findByEmail(adminEmail);
            if (adminUser && !adminUser.isAdmin) {
                await usersService.update(adminUser.id, { isAdmin: true });
                console.log(`✅ Auto-promoted ${adminEmail} to admin.`);
            }
            else if (adminUser) {
                console.log(`✅ Admin user (${adminEmail}) is already set.`);
            }
            else {
                console.warn(`⚠️  ADMIN_EMAIL is set to "${adminEmail}" but no matching user was found in the database yet.`);
            }
        }
    }
    catch (error) {
        fs.writeFileSync('error_log.txt', `[STUPID ERROR] ${new Date().toISOString()}\n${error?.stack || error}\n`);
        throw error;
    }
}
void bootstrap();
//# sourceMappingURL=main.js.map