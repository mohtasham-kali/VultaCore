import { NestFactory } from '@nestjs/core';
import * as fs from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, {
      // Capture raw body buffer — required for Lemon Squeezy webhook HMAC verification
      rawBody: true,
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
