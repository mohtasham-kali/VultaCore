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

    // Support Unix sockets or explicit 0.0.0.0 IPv4 binding for reliable reverse proxying
    if (typeof port === 'string' && isNaN(Number(port))) {
      // PORT is a unix socket path: remove any stale socket left by a previous crash
      if (fs.existsSync(port)) {
        fs.unlinkSync(port);
      }
      await app.listen(port);
      // Allow the proxy process to connect to the socket
      fs.chmodSync(port, 0o666);
    } else {
      await app.listen(Number(port), '0.0.0.0');
    }
    console.log(`Application is running on: ${port}`);

    // Auto-seed if database is empty (important for Hostinger)
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
    } catch (seedError: any) {
      // Do not crash a running server because seeding failed
      console.error('Auto-seed failed (server keeps running):', seedError?.message || seedError);
    }
  } catch (error: any) {
    fs.writeFileSync(
      'error_log.txt',
      `[STARTUP ERROR] ${new Date().toISOString()}\n${error?.stack || error}\n`,
    );
    // Throw error so server.js can catch it and display the fallback 500 error page!
    throw error;
  }
}
void bootstrap();