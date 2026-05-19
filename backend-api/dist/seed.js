"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const users_service_1 = require("./users/users.service");
const forum_service_1 = require("./forum/forum.service");
const bots_service_1 = require("./bots/bots.service");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const usersService = app.get(users_service_1.UsersService);
    const forumService = app.get(forum_service_1.ForumService);
    const botsService = app.get(bots_service_1.BotsService);
    console.log('Seeding data...');
    const user = await usersService.create({
        id: 'mock-uuid',
        username: 'Alice',
        email: 'alice@example.com',
        password: 'password123',
        points: 1250,
    });
    await usersService.create({
        id: 'vultabot-uuid',
        username: 'VultaBot',
        email: 'bot@vultacore.app',
        password: 'bot-password-123',
        points: 0,
        isBot: true,
    });
    await forumService.createPost({
        title: 'How to fix "TypeError: Cannot read property map of undefined" in React?',
        content: `I'm getting this frustrating error in my React component when trying to render a list. The data comes from an API call...`,
        type: 'dev',
        tags: ['react', 'javascript'],
    }, user);
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
//# sourceMappingURL=seed.js.map