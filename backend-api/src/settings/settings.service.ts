import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private settingsRepository: Repository<Setting>,
  ) {}

  async getValue(key: string, defaultValue: string = ''): Promise<string> {
    const setting = await this.settingsRepository.findOne({ where: { key } });
    return setting ? setting.value : defaultValue;
  }

  async setValue(key: string, value: string): Promise<Setting> {
    const setting = await this.settingsRepository.findOne({ where: { key } });
    if (setting) {
      setting.value = value;
      return this.settingsRepository.save(setting);
    } else {
      const newSetting = this.settingsRepository.create({ key, value });
      return this.settingsRepository.save(newSetting);
    }
  }

  async getAll(): Promise<Record<string, string>> {
    const settings = await this.settingsRepository.find();
    return settings.reduce(
      (acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      },
      {} as Record<string, string>,
    );
  }
}
