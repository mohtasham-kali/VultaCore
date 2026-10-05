import { NestFactory } from '@nestjs/core';
import * as fs from 'fs';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import csurf from 'csurf';

// External services that call us cannot send a CSRF token.
// POST /api/billing/webhook is authenticated by the Lemon Squeezy HMAC
// signature (x-signature) checked in BillingService.handleWebhook().
const CSRF_EXEMPT_PATHS = ['/api/billing/webhook'];

async function bootstrap() {
  // === DIAGNOSTIC: Runtime directory and sqlite3 resolution ===
  console.log('[STARTUP] Current working directory:', process.cwd());
  console.log('[STARTUP] Application directory (__dirname):', __dirname);
  
  try {
    const sqlite3Path = require.resolve('sqlite3');
    console.log('[STARTUP] sqlite3 resolved from:', sqlite3Path);
  } catch (error: any) {
    console.error('[STARTUP] ❌ sqlite3 cannot be resolved:', error.message);
  }
  
  try {
    const app = await NestFactory.create(AppModule, {
      // Capture raw body buffer — required for Lemon Squeezy webhook HMAC verification
      rawBody: true,
    });
    // Security middlewares
    app.use(cookieParser());
    // csurf expects the CSRF token to be sent in a header (e.g., 'x-csrf-token')
    const csrfProtection = csurf({ cookie: true });
    app.use((req: any, res: any, next: any) => {
      if (CSRF_EXEMPT_PATHS.includes(req.path.replace(/\/+$/, ''))) {
        return next();
      }
      return csrfProtection(req, res, next);
    });
    // Expose CSRF token to clients (only on routes where csurf ran)
    app.use((req: any, res: any, next: any) => {
      if (typeof req.csrfToken === 'function') {
        res.cookie('XSRF-TOKEN', req.csrfToken(), { httpOnly: false });
      }
      next();
    });
    app.enableCors();
    app.setGlobalPrefix('api');
    const port = process.env.PORT || 3001;

    // Support Unix sockets from Hostinger/Passenger natively
    await app.listen(port);
    console.log(`Application is running on: ${port}`);

    // Auto-seed if database is empty (important for Hostinger)
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

    // Auto-promote the ADMIN_EMAIL user to admin on every startup
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      const { UsersService } = require('./users/users.service');
      const usersService = app.get(UsersService);
      const adminUser = await usersService.findByEmail(adminEmail);
      if (adminUser && !adminUser.isAdmin) {
        await usersService.update(adminUser.id, { isAdmin: true });
        console.log(`✅ Auto-promoted ${adminEmail} to admin.`);
      } else if (adminUser) {
        console.log(`✅ Admin user (${adminEmail}) is already set.`);
      } else {
        console.warn(`⚠️  ADMIN_EMAIL is set to "${adminEmail}" but no matching user was found in the database yet.`);
      }
    }
  } catch (error: any) {
    fs.writeFileSync(
      'error_log.txt',
      `[STUPID ERROR] ${new Date().toISOString()}\n${error?.stack || error}\n`,
    );
    // Throw error so server.js can catch it and display the fallback 500 error page!
    throw error;
  }
}
void bootstrap();