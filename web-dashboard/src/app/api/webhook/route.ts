import { NextRequest } from "next/server";
import { getPaddleInstance } from "@/utils/paddle/get-paddle-instance";
import { processEvent } from "@/utils/paddle/process-webhook";

// In-memory cache for Paddle live IP addresses (refreshed every hour from https://api.paddle.com/ips)
let cachedIps: string[] = [];
let cacheExpiresAt = 0;

async function getPaddleLiveIps(): Promise<string[]> {
  const now = Date.now();
  if (cachedIps.length > 0 && now < cacheExpiresAt) {
    return cachedIps;
  }
  try {
    const res = await fetch("https://api.paddle.com/ips", { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      const cidrs: string[] = data?.data?.ipv4_cidrs || [];
      cachedIps = cidrs.map((c) => c.split("/")[0].trim());
      cacheExpiresAt = now + 3600 * 1000;
    }
  } catch (err) {
    console.warn("[webhook] Could not fetch Paddle live IPs, using fallback:", err);
    if (cachedIps.length === 0) {
      cachedIps = [
        "34.237.3.244",
        "34.195.105.136",
        "34.232.58.13",
        "35.155.119.135",
        "34.212.5.7",
        "52.11.166.252",
      ];
    }
  }
  return cachedIps;
}

export async function POST(request: NextRequest) {
  // In live production mode, allowlist Paddle's current live IP addresses
  const isProduction =
    process.env.NEXT_PUBLIC_PADDLE_ENV === "production" ||
    process.env.PADDLE_ENV === "production";

  if (isProduction) {
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip")?.trim() ||
      "";

    if (clientIp) {
      const allowedIps = await getPaddleLiveIps();
      if (!allowedIps.includes(clientIp)) {
        console.warn(`[webhook] Rejected delivery from unauthorized IP: ${clientIp}`);
        return Response.json({ error: "Forbidden: unauthorized IP" }, { status: 403 });
      }
    }
  }

  const signature = request.headers.get("paddle-signature") ?? "";
  const rawBody = await request.text();

  // Pre-validation: a request with no signature header or empty body
  // can't be verified or processed. Return 400 (non-2xx) so Paddle retries.
  if (!signature || !rawBody) {
    return Response.json(
      { error: "Missing paddle-signature header or empty body" },
      { status: 400 },
    );
  }

  // Support both notification destination secret and simulation secret
  const secrets = [
    process.env.PADDLE_NOTIFICATION_WEBHOOK_SECRET,
    process.env.PADDLE_WEBHOOK_SECRET,
  ].filter(Boolean) as string[];

  if (secrets.length === 0) {
    console.error(
      "[webhook] Neither PADDLE_NOTIFICATION_WEBHOOK_SECRET nor PADDLE_WEBHOOK_SECRET is set",
    );
    return Response.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  try {
    const paddle = getPaddleInstance();
    let eventData: any = null;
    let unmarshalError: unknown = null;

    // Try verification against configured secrets
    for (const secret of secrets) {
      try {
        eventData = await paddle.webhooks.unmarshal(rawBody, secret, signature);
        if (eventData) break;
      } catch (err) {
        unmarshalError = err;
      }
    }

    if (!eventData) {
      console.error("[webhook] Signature verification failed:", unmarshalError);
      // Return non-2xx so Paddle retries
      return Response.json({ error: "Invalid signature" }, { status: 500 });
    }

    await processEvent(eventData);

    // Fast 2xx acknowledgment
    return Response.json({ received: true }, { status: 200 });
  } catch (e) {
    console.error("[webhook] Error processing webhook:", e);
    // Any non-2xx tells Paddle to retry
    return Response.json({ error: "Internal processing error" }, { status: 500 });
  }
}

