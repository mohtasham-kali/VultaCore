import { SettingsService } from './settings.service';
export declare class SettingsController {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
    getSettings(): Promise<Record<string, string>>;
    updateSettings(updateSettingsDto: Record<string, string>): Promise<Record<string, string>>;
}
