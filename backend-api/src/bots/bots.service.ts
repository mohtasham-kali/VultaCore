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

  async executeBot(id: string, prompt: string, userId: string, context?: string): Promise<any> {
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
      memoryContext = 'Conversation History:\n' + orderedHistory.map(msg => 
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n') + '\n\n';
    }
    
    const finalContext = memoryContext + (context ? `User Context/File:\n${context}` : '');

    bot.status = 'working';
    await this.botsRepository.save(bot);

    try {
      console.log(`Executing bot ${bot.name} for user ${userId}...`);
      const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
      const isSocket = typeof aiServiceUrl === 'string' && (aiServiceUrl.startsWith('/') || aiServiceUrl.endsWith('.sock') || aiServiceUrl.startsWith('unix:'));
      const socketPath = isSocket ? aiServiceUrl.replace(/^unix:\/\//, '').replace(/^unix:/, '') : undefined;
      const requestUrl = isSocket ? 'http://localhost/execute' : `${aiServiceUrl}/execute`;
      const requestConfig = socketPath ? { socketPath } : {};

      const response = await firstValueFrom(
        this.httpService.post(requestUrl, {
          prompt,
          user_id: userId,

          bot_type: bot.type,
          bot_name: bot.name,
          context: finalContext || null
        }, requestConfig),
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
        content: response.data.response || JSON.stringify(response.data),
      });

      return response.data;
    } catch (error: any) {
      const debugMsg = error?.response?.data?.detail 
        || error?.response?.data?.error 
        || error?.message 
        || error?.code 
        || JSON.stringify(error)
        || 'Unknown connection or parsing error';
        
      console.warn(`[BotsService] AI Microservice unavailable (${bot.name}): ${debugMsg}. Invoking direct cloud fallback...`);
      
      try {
        const fallbackData = await this.fallbackDirectCloud(bot, prompt, finalContext);
        
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
          content: fallbackData.response || JSON.stringify(fallbackData),
        });

        return fallbackData;
      } catch (fallbackError: any) {
        bot.status = 'idle';
        await this.botsRepository.save(bot);
        console.error(`[BotsService] All AI engines failed (${bot.name}):`, fallbackError.message);
        return { error: `AI Service communication failed: ${debugMsg}. Fallback: ${fallbackError.message}` };
      }
    }
  }

  private async fallbackDirectCloud(
    bot: Bot,
    prompt: string,
    context?: string,
  ): Promise<{ bot_name: string; response: string; confidence: number; processing_time: number; metadata: any }> {
    const startTime = Date.now();
    const systemRole = bot.type === 'cyber'
      ? 'You are an advanced Cyber Security AI Agent. Provide expert security analysis, threat mitigation, and code audit insights.'
      : bot.name === 'Text to Code'
      ? 'You are an expert software engineer. Write high-quality, robust, and clean code with clear explanations.'
      : bot.name === 'Bug Fixer'
      ? 'You are a master debugging specialist. Analyze the problem, identify root causes, and provide working solutions.'
      : 'You are an intelligent, helpful AI assistant built into VultaCore.';

    const fullPrompt = context
      ? `CONTEXT:\n${context}\n\nUSER REQUEST:\n${prompt}`
      : prompt;

    // 1. Try OpenRouter (Default: GPT-4o)
    const openrouterKey = (process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API || '').trim();
    if (openrouterKey) {
      const models = ['openai/gpt-4o', 'meta-llama/llama-3.3-70b-instruct', 'google/gemini-2.0-flash-001'];
      for (const model of models) {
        try {
          const res = await firstValueFrom(
            this.httpService.post(
              'https://openrouter.ai/api/v1/chat/completions',
              {
                model,
                messages: [
                  { role: 'system', content: systemRole },
                  { role: 'user', content: fullPrompt },
                ],
                max_tokens: 1000,
              },
              {
                headers: {
                  Authorization: `Bearer ${openrouterKey}`,
                  'Content-Type': 'application/json',
                  'HTTP-Referer': 'https://vultacore.techprogression.com',
                  'X-Title': 'VultaCore SaaS',
                },
                timeout: 18000,
              },
            ),
          );
          const reply = res.data?.choices?.[0]?.message?.content;
          if (reply) {
            return {
              bot_name: bot.name,
              response: reply,
              confidence: 0.96,
              processing_time: (Date.now() - startTime) / 1000,
              metadata: { engine: `${model} (Direct OpenRouter Fallback)` },
            };
          }
        } catch (e: any) {
          console.warn(`[OpenRouter Direct Error] ${model}: ${e.message}`);
        }
      }
    }

    // 2. Try Gemini
    const geminiKey = (process.env.GEMINI_API_KEY || process.env.GEMINI_API || process.env.GENAI_API || '').trim();
    if (geminiKey) {
      const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
      for (const m of models) {
        try {
          const res = await firstValueFrom(
            this.httpService.post(
              `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${geminiKey}`,
              {
                contents: [
                  {
                    parts: [
                      { text: `${systemRole}\n\n${fullPrompt}` }
                    ]
                  }
                ]
              },
              {
                headers: { 'Content-Type': 'application/json' },
                timeout: 18000,
              }
            )
          );
          const reply = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) {
            return {
              bot_name: bot.name,
              response: reply,
              confidence: 0.95,
              processing_time: (Date.now() - startTime) / 1000,
              metadata: { engine: `${m} (Direct Gemini Fallback)` },
            };
          }
        } catch (e: any) {
          console.warn(`[Gemini Direct Error] ${m}: ${e.message}`);
        }
      }
    }

    // 3. Try Groq
    const groqKey = (process.env.GROQ_API_KEY || process.env.GROQ_API || '').trim();
    if (groqKey) {
      const models = ['openai/gpt-oss-120b', 'llama-3.3-70b-versatile'];
      for (const m of models) {
        try {
          const res = await firstValueFrom(
            this.httpService.post(
              'https://api.groq.com/openai/v1/chat/completions',
              {
                model: m,
                messages: [
                  { role: 'system', content: systemRole },
                  { role: 'user', content: fullPrompt },
                ],
              },
              {
                headers: {
                  Authorization: `Bearer ${groqKey}`,
                  'Content-Type': 'application/json',
                },
                timeout: 18000,
              }
            )
          );
          const reply = res.data?.choices?.[0]?.message?.content;
          if (reply) {
            return {
              bot_name: bot.name,
              response: reply,
              confidence: 0.94,
              processing_time: (Date.now() - startTime) / 1000,
              metadata: { engine: `${m} (Direct Groq Fallback)` },
            };
          }
        } catch (e: any) {
          console.warn(`[Groq Direct Error] ${m}: ${e.message}`);
        }
      }
    }

    throw new Error('All AI providers (OpenRouter, Gemini, Groq) failed or keys are missing.');
  }

  async getHistory(botId: string, userId: string): Promise<ConversationMessage[]> {
    const history = await this.conversationRepository.find({
      where: { botId, userId },
      order: { createdAt: 'ASC' },
      take: 50,
    });
    return history;
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
