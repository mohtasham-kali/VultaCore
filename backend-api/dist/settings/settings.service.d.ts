import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';
export declare class SettingsService {
    private settingsRepository;
    constructor(settingsRepository: Repository<Setting>);
    getValue(key: string, defaultValue?: string): Promise<string>;
    setValue(key: string, value: string): Promise<Setting>;
    getAll(): Promise<Record<string, string>>;
}
