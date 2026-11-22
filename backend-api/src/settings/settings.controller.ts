import { Controller, Get, Patch, Body, UseGuards, Header } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  async getSettings() {
    return this.settingsService.getAll();
  }

  @Patch()
  @UseGuards(SupabaseAuthGuard, AdminGuard)
  async updateSettings(@Body() updateSettingsDto: Record<string, string>) {
    const promises = Object.entries(updateSettingsDto).map(([key, value]) =>
      this.settingsService.setValue(key, value.toString())
    );
    await Promise.all(promises);
    return this.settingsService.getAll();
  }
}
