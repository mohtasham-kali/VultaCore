import { NestFactory } from '@nestjs/core';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { NestExpressApplication } from '@nestjs/platform-express';
import * as fs from 'node:fs';
import * as path from 'node:path';
import cookieParser from 'cookie-parser';
import csurf from 'csurf';
import { AppModule } from './app.module';
import { BotsService } from './bots/bots.service';
import { PlansService } from './plans/plans.service';
import { UsersService } from './users/users.service';

declare module 'express-serve-static-core' {
  interface Request {
    csrfToken(): string;
  }
}

type CookieParserFactory = () => RequestHandler;

type CsurfOptions = {
  cookie: {
    key: string;
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'lax' | 'strict' | 'none';
    path: string;
  };
};

type CsurfFactory = (options: CsurfOptions) => RequestHandler;

const createCookieParser = cookieParser as unknown as CookieParserFactory;

const createCsurf = csurf as unknown as CsurfFactory;

const csrfExemptPaths = new Set(['/api/billing/webhook']);

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function normalizePath(value: string): string {
  return value.split('?')[0].replace(/\/+$/, '') || '/';
}

async function bootstrap(): Promise<void> {
  console.log('[STARTUP] Current working directory:', process.cwd());

  console.log('[STARTUP] Application directory:', __dirname);

  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      rawBody: true,
    });

    const isProduction = process.env.NODE_ENV === 'production';

    const backendPort = Number(process.env.PORT || 3001);

    const frontendUrl = process.env.FRONTEND_URL?.trim();

    const allowedOrigins = [
      frontendUrl,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://192.168.100.86:3000',
    ].filter((origin): origin is string => Boolean(origin));

    app.enableCors({
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-CSRF-Token',
        'X-XSRF-Token',
      ],
    });

    const cookieMiddleware: RequestHandler = createCookieParser();

    app.use(cookieMiddleware);

    const csrfMiddleware: RequestHandler = createCsurf({
      cookie: {
        key: '_csrf',
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
      },
    });

    app.use((req: Request, res: Response, next: NextFunction): void => {
      const requestPath = normalizePath(req.path || req.url || '/');

      const isOptionsRequest = req.method === 'OPTIONS';

      const isExemptPath = csrfExemptPaths.has(requestPath);

      if (isOptionsRequest || isExemptPath) {
        next();
        return;
      }

      csrfMiddleware(req, res, next);
    });

    app.use((req: Request, res: Response, next: NextFunction): void => {
      try {
        const token = req.csrfToken();

        res.cookie('XSRF-TOKEN', token, {
          httpOnly: false,
          secure: isProduction,
          sameSite: 'lax',
          path: '/',
        });

        next();
      } catch (error: unknown) {
        next(error);
      }
    });

    type ExpressApp = {
      get: (
        path: string,
        handler: (req: Request, res: Response) => void,
      ) => void;
    };

    const expressApp = app.getHttpAdapter().getInstance() as ExpressApp;

    expressApp.get('/api/csrf-token', (req: Request, res: Response): void => {
      const token = req.csrfToken();

      res.cookie('XSRF-TOKEN', token, {
        httpOnly: false,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
      });

      res.json({
        csrfToken: token,
      });
    });

    app.setGlobalPrefix('api');

    await app.listen(backendPort, '0.0.0.0');

    console.log(`Application is running on: ${backendPort}`);

    const botsService = app.get(BotsService);

    const existingBots = await botsService.findAll();

    if (existingBots.length === 0) {
      console.log('Empty database detected. Running auto-seed...');

      await botsService.create({
        name: 'Bug Scanner',
        type: 'general',
        status: 'idle',
        description: 'Scans your codebase for bugs.',
      });

      await botsService.create({
        name: 'Vulnerability Finder',
        type: 'cyber',
        status: 'working',
        description: 'Searching for CVEs.',
      });

      console.log('✅ Bots auto-seed successful.');
    }

    const plansService = app.get(PlansService);

    const existingPlans = await plansService.findAll();

    if (existingPlans.length === 0) {
      console.log('No plans found. Running plans auto-seed...');

      await plansService.create({
        name: 'Free',
        price: 0,
        interval: 'monthly',
        features: ['Basic access'],
        variantId: 'free-tier',
      });

      await plansService.create({
        name: 'Standard',
        price: 19,
        interval: 'monthly',
        features: ['Standard access'],
        variantId: process.env.LS_VARIANT_STANDARD || '1820715',
      });

      await plansService.create({
        name: 'Premium',
        price: 49,
        interval: 'monthly',
        features: ['Premium access'],
        variantId: process.env.LS_VARIANT_PREMIUM || '1820708',
      });

      await plansService.create({
        name: 'Enterprise',
        price: 99,
        interval: 'monthly',
        features: ['Enterprise access'],
        variantId:
          process.env.LS_VARIANT_ENTERPRISE ||
          process.env.LS_VARIANT_ENTERPISE ||
          '1860093',
      });

      console.log('✅ Plans auto-seed successful.');
    }

    const adminEmail = process.env.ADMIN_EMAIL?.trim();

    if (adminEmail) {
      const usersService = app.get(UsersService);

      const adminUser = await usersService.findByEmail(adminEmail);

      if (adminUser && !adminUser.isAdmin) {
        await usersService.update(adminUser.id, {
          isAdmin: true,
        });

        console.log(`✅ Auto-promoted ${adminEmail} to admin.`);
      } else if (adminUser) {
        console.log(`✅ Admin user (${adminEmail}) is already set.`);
      } else {
        console.warn(`⚠️ No user found for ADMIN_EMAIL=${adminEmail}.`);
      }
    }
  } catch (error: unknown) {
    const message = getErrorMessage(error);

    const stack = error instanceof Error && error.stack ? error.stack : message;

    const errorPath = path.join(process.cwd(), 'error_log.txt');

    fs.writeFileSync(
      errorPath,
      [`[STARTUP ERROR] ${new Date().toISOString()}`, stack, ''].join('\n'),
      'utf8',
    );

    console.error('[STARTUP ERROR]', stack);

    throw error;
  }
}

void bootstrap();
