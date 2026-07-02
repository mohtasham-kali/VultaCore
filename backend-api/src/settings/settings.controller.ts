import { Controller, Get, Patch, Body } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings() {
    return this.settingsService.getAll();
  }

  @Patch()
  async updateSettings(@Body() updateSettingsDto: Record<string, string>) {
    const promises = Object.entries(updateSettingsDto).map(([key, value]) =>
      this.settingsService.setValue(key, value.toString()),
    );
    await Promise.all(promises);
    return this.settingsService.getAll();
  }
}
