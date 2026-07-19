import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { EventsGateway } from '../events/events.gateway';
import { PlansService } from '../plans/plans.service';
export declare class BillingService {
    private readonly http;
    private readonly config;
    private readonly usersService;
    private readonly eventsGateway;
    private readonly plansService;
    private readonly logger;
    private readonly lsApiKey;
    private readonly lsStoreId;
    private readonly lsWebhookSecret;
    private readonly appUrl;
    constructor(http: HttpService, config: ConfigService, usersService: UsersService, eventsGateway: EventsGateway, plansService: PlansService);
    createCheckoutSession(planName: string, userId: string, userEmail: string): Promise<string>;
    handleWebhook(rawBody: Buffer, signature: string): Promise<void>;
}
