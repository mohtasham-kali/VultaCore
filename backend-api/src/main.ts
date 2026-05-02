import { NestFactory } from '@nestjs/core';
import * as fs from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    app.enableCors();
    
    const port = process.env.PORT || 3001;
    await app.listen(port, '0.0.0.0');
    console.log(`VultaCore API is running on: http://0.0.0.0:${port}`);
  } catch (error) {
    fs.writeFileSync('error_log.txt', `[STUPID ERROR] ${new Date().toISOString()}\n${error.stack}\n`);
    process.exit(1);
  }
}
bootstrap();
