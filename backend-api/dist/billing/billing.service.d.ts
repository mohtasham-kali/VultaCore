import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { EventsGateway } from '../events/events.gateway';
export declare class BillingService {
    private readonly http;
    private readonly config;
    private readonly usersService;
    private readonly eventsGateway;
    private readonly logger;
    private readonly lsApiKey;
    private readonly lsStoreId;
    private readonly lsWebhookSecret;
    private readonly appUrl;
    private readonly variantToPlan;
    constructor(http: HttpService, config: ConfigService, usersService: UsersService, eventsGateway: EventsGateway);
    createCheckoutSession(planName: string, userId: string, userEmail: string): Promise<string>;
    handleWebhook(rawBody: Buffer, signature: string): Promise<void>;
}
