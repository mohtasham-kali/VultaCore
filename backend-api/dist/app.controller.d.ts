import { AppService } from './app.service';
import { ChatGateway } from './chat/chat.gateway';
import { UsersService } from './users/users.service';
export declare class AppController {
    private readonly appService;
    private readonly chatGateway;
    private readonly usersService;
    constructor(appService: AppService, chatGateway: ChatGateway, usersService: UsersService);
    getHello(): string;
    handleLemonSqueezyWebhook(payload: any, authHeader?: string): Promise<{
        status: string;
    }>;
}
