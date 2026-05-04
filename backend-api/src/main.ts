import { NestFactory } from '@nestjs/core';
import * as fs from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    app.enableCors();
    app.setGlobalPrefix('api');
    const port = process.env.PORT || 3001;
    
    // Support Unix sockets from Hostinger/Passenger natively
    if (typeof port === 'string' && isNaN(Number(port))) {
      await app.listen(port);
    } else {
      await app.listen(port, '0.0.0.0');
    }
    console.log(`Application is running on: ${port}`);
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
