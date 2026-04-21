import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { ForumService } from './forum/forum.service';
import { BotsService } from './bots/bots.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const forumService = app.get(ForumService);
  const botsService = app.get(BotsService);

  console.log('Seeding data...');

  // Create Mock User
  const user = await usersService.create({
    id: 'mock-uuid', // Force ID to match controller's mock
    username: 'Alice',
    email: 'alice@example.com',
    password: 'password123',
    points: 1250,
  });

  // Create Mock Posts
  await forumService.createPost({
    title: 'How to fix "TypeError: Cannot read property map of undefined" in React?',
    content: `I'm getting this frustrating error in my React component when trying to render a list. The data comes from an API call...`,
    type: 'dev',
    tags: ['react', 'javascript'],
  }, user);

  // Create Mock Bots
  await botsService.create({
    name: 'Bug Scanner',
    type: 'general',
    status: 'idle',
    description: 'Scans your codebase for obvious bugs and typos.',
  });

  await botsService.create({
    name: 'Vulnerability Finder',
    type: 'cyber',
    status: 'working',
    description: 'Actively searching for CVEs in your dependencies.',
  });

  console.log('Seeding complete!');
  await app.close();
}

bootstrap();
