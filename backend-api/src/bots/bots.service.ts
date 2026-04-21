import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bot } from './entities/bot.entity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class BotsService {
  constructor(
    @InjectRepository(Bot)
    private botsRepository: Repository<Bot>,
    private readonly httpService: HttpService,
  ) {}

  findAll(type?: 'general' | 'cyber'): Promise<Bot[]> {
    if (type) {
      return this.botsRepository.find({ where: { type } });
    }
    return this.botsRepository.find();
  }

  async executeBot(id: string, prompt: string, context?: string): Promise<any> {
    const bot = await this.botsRepository.findOneBy({ id });
    if (!bot) return { error: 'Bot not found' };

    bot.status = 'working';
    await this.botsRepository.save(bot);

    try {
      const response = await firstValueFrom(
        this.httpService.post('http://localhost:8000/execute', {
          prompt,
          user_id: 'mock-uuid',
          bot_type: bot.type,
          bot_name: bot.name,
          context: context || null
        }),
      );

      bot.status = 'completed';
      await this.botsRepository.save(bot);

      return response.data;
    } catch (error) {
      bot.status = 'idle';
      await this.botsRepository.save(bot);
      return { error: 'AI Service communication failed' };
    }
  }

  async updateStatus(id: string, status: 'idle' | 'working' | 'completed'): Promise<Bot | null> {
    const bot = await this.botsRepository.findOneBy({ id });
    if (bot) {
      bot.status = status;
      return this.botsRepository.save(bot);
    }
    return null;
  }
  
  create(botData: Partial<Bot>): Promise<Bot> {
    const bot = this.botsRepository.create(botData);
    return this.botsRepository.save(bot);
  }

  async seed(): Promise<void> {
    const bots = [
      // General Bots
      { name: 'Text to Code', type: 'general', category: 'Code Tools', description: 'Convert natural language descriptions into executable code.' },
      { name: 'Image to Code', type: 'general', category: 'Code Tools', description: 'Generate code from UI mockups or screenshots.' },
      { name: 'Error Explainer', type: 'general', category: 'Analysis', description: 'Detailed explanation of compiler or runtime errors.' },
      { name: 'Bug Fixer', type: 'general', category: 'Analysis', description: 'Identify and resolve logic bugs or syntax issues.' },
      
      // Cyber Bots
      { name: 'Vulnerability Detection', type: 'cyber', category: 'Security Audit', description: 'Scan code for common security vulnerabilities (OWASP Top 10).' },
      { name: 'Have I Been Pwned', type: 'cyber', category: 'Threat Intel', description: 'Check if credentials have been compromised in known data breaches.' },
    ];

    for (const botData of bots) {
      const existing = await this.botsRepository.findOneBy({ name: botData.name });
      if (!existing) {
        await this.create(botData as any);
      }
    }
  }
}
