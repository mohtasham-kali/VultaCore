import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bot } from './entities/bot.entity';
import { ConversationMessage } from './entities/conversation-message.entity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class BotsService {
  constructor(
    @InjectRepository(Bot)
    private botsRepository: Repository<Bot>,
    @InjectRepository(ConversationMessage)
    private conversationRepository: Repository<ConversationMessage>,
    private readonly httpService: HttpService,
  ) {}

  findAll(type?: 'general' | 'cyber'): Promise<Bot[]> {
    if (type) {
      return this.botsRepository.find({ where: { type } });
    }
    return this.botsRepository.find();
  }

  async executeBot(
    id: string,
    prompt: string,
    userId: string,
    context?: string,
  ): Promise<any> {
    const bot = await this.botsRepository.findOneBy({ id });
    if (!bot) return { error: 'Bot not found' };

    // Fetch conversation memory (last 10 messages)
    const history = await this.conversationRepository.find({
      where: { botId: id, userId },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    // Sort ascending for chronological context
    const orderedHistory = history.reverse();
    let memoryContext = '';
    if (orderedHistory.length > 0) {
      memoryContext =
        'Conversation History:\n' +
        orderedHistory
          .map(
            (msg) =>
              `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`,
          )
          .join('\n') +
        '\n\n';
    }

    const finalContext =
      memoryContext + (context ? `User Context/File:\n${context}` : '');

    bot.status = 'working';
    await this.botsRepository.save(bot);

    try {
      let aiServiceUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001';

      // Ensure the URL has the http/https protocol
      if (
        !aiServiceUrl.startsWith('http://') &&
        !aiServiceUrl.startsWith('https://')
      ) {
        aiServiceUrl = `http://${aiServiceUrl}`;
      }

      console.log(`Executing bot ${bot.name} for user ${userId}...`);
      console.log(`Resolved AI_SERVICE_URL: ${aiServiceUrl}`);

      // Connectivity check (gives immediate, actionable error)
      // / is expected to return { status: "AI Service Online", ... }
      try {
        const healthRes = await firstValueFrom(
          this.httpService.get(`${aiServiceUrl}/`),
        );
        console.log('AI service base health:', healthRes.data);
      } catch (healthErr) {
        let debugMsg: string;
        if (healthErr instanceof Error) {
          debugMsg = healthErr.message;
        } else if (
          typeof healthErr === 'object' &&
          healthErr !== null &&
          'response' in healthErr
        ) {
          const err = healthErr as {
            response?: { data?: { detail?: string; error?: string } };
          };
          debugMsg =
            err.response?.data?.detail ||
            err.response?.data?.error ||
            'Unknown AI service connectivity error';
        } else {
          debugMsg = 'Unknown AI service connectivity error';
        }
        throw new Error(
          `AI service not reachable at ${aiServiceUrl}/: ${debugMsg}`,
        );
      }
      const response = await firstValueFrom(
        this.httpService.post<{ response?: string }>(
          `${aiServiceUrl}/execute`,
          {
            prompt,
            user_id: userId,

            bot_type: bot.type,
            bot_name: bot.name,
            context: finalContext || null,
          },
        ),
      );

      bot.status = 'completed';
      await this.botsRepository.save(bot);

      // Save user prompt
      await this.conversationRepository.save({
        userId,
        botId: id,
        role: 'user',
        content: prompt,
      });

      // Save assistant response
      await this.conversationRepository.save({
        userId,
        botId: id,
        role: 'assistant',
        content:
          (response.data.response as string) || JSON.stringify(response.data),
      });

      return response.data;
    } catch (error) {
      bot.status = 'idle';
      await this.botsRepository.save(bot);

      let debugMsg: string;
      if (error instanceof Error) {
        debugMsg = error.message;
      } else if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error
      ) {
        const err = error as {
          response?: { data?: { detail?: string; error?: string } };
          message?: string;
          code?: string;
        };
        debugMsg =
          (typeof err.response?.data?.detail === 'string'
            ? err.response.data.detail
            : null) ||
          (typeof err.response?.data?.error === 'string'
            ? err.response.data.error
            : null) ||
          (typeof err.message === 'string' ? err.message : null) ||
          (typeof err.code === 'string' ? err.code : null) ||
          JSON.stringify(error);
      } else {
        debugMsg = JSON.stringify(error);
      }

      console.error(`AI Service Error (${bot.name}):`, debugMsg);
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const errorResponse = (error as Record<string, unknown>).response;
        if (
          typeof errorResponse === 'object' &&
          errorResponse !== null &&
          'data' in errorResponse
        ) {
          console.error(
            'Response data:',
            (errorResponse as Record<string, unknown>).data,
          );
        }
      }
      return { error: `AI Service communication failed: ${debugMsg}` };
    }
  }

  async getHistory(
    botId: string,
    userId: string,
  ): Promise<ConversationMessage[]> {
    const history = await this.conversationRepository.find({
      where: { botId, userId },
      order: { createdAt: 'ASC' },
      take: 50,
    });
    return history;
  }

  async updateStatus(
    id: string,
    status: 'idle' | 'working' | 'completed',
  ): Promise<Bot | null> {
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
      {
        name: 'Text to Code',
        type: 'general',
        category: 'Code Tools',
        description:
          'Convert natural language descriptions into executable code.',
      },
      {
        name: 'Image to Code',
        type: 'general',
        category: 'Code Tools',
        description: 'Generate code from UI mockups or screenshots.',
      },
      {
        name: 'Error Explainer',
        type: 'general',
        category: 'Analysis',
        description: 'Detailed explanation of compiler or runtime errors.',
      },
      {
        name: 'Bug Fixer',
        type: 'general',
        category: 'Analysis',
        description: 'Identify and resolve logic bugs or syntax issues.',
      },

      // Cyber Bots
      {
        name: 'Vulnerability Detection',
        type: 'cyber',
        category: 'Security Audit',
        description:
          'Scan code for common security vulnerabilities (OWASP Top 10).',
      },
      {
        name: 'Have I Been Pwned',
        type: 'cyber',
        category: 'Threat Intel',
        description:
          'Check if credentials have been compromised in known data breaches.',
      },
    ];

    for (const botData of bots) {
      const existing = await this.botsRepository.findOneBy({
        name: botData.name,
      });
      if (!existing) {
        await this.create(botData as Partial<Bot>);
      }
    }
  }
}
