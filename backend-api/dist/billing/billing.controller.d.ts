import { Request } from 'express';
import { BillingService } from './billing.service';
interface CheckoutDto {
    planName: string;
    userId: string;
    userEmail: string;
}
export declare class BillingController {
    private readonly billingService;
    private readonly logger;
    constructor(billingService: BillingService);
    createCheckout(body: CheckoutDto): Promise<{
        checkoutUrl: string;
    }>;
    handleWebhook(req: Request, signature: string): Promise<{
        received: boolean;
    }>;
}
export {};
