import { Paddle, Environment, LogLevel } from "@paddle/paddle-node-sdk";

let instance: Paddle | null = null;

/**
 * Returns a singleton Paddle SDK instance.
 * Reads PADDLE_API_KEY / PADDLE_SANDBOX_API_KEY and NEXT_PUBLIC_PADDLE_ENV at runtime —
 * never baked into the client bundle. Only import from Server Components, Server Actions,
 * or Route Handlers.
 */
export function getPaddleInstance(): Paddle {
  if (!instance) {
    const apiKey =
      process.env.PADDLE_API_KEY || process.env.PADDLE_SANDBOX_API_KEY;
    if (!apiKey) {
      throw new Error(
        "PADDLE_API_KEY or PADDLE_SANDBOX_API_KEY environment variable is not set.",
      );
    }

    const env =
      process.env.NEXT_PUBLIC_PADDLE_ENV === "production" ||
      apiKey.startsWith("pdl_live_")
        ? Environment.production
        : Environment.sandbox;

    instance = new Paddle(apiKey, {
      environment: env,
      logLevel: LogLevel.error,
    });
  }

  return instance;
}
