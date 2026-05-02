import { NestFactory } from '@nestjs/core';
import * as fs from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    app.enableCors();
    
    const port = process.env.PORT || process.env.PORT;
    await app.listen(port, '0.0.0.0');
    console.log(`VultaCore API is running on PORT: ${port}`);
  } catch (error: any) {
    fs.writeFileSync(
      'error_log.txt',
      `[STUPID ERROR] ${new Date().toISOString()}\n${error?.stack || error}\n`,
    );
    process.exit(1);
  }
}
void bootstrap();
