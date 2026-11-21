import { NextRequest } from "next/server";
import { getPaddleInstance } from "@/utils/paddle/get-paddle-instance";
import { processEvent } from "@/utils/paddle/process-webhook";

export async function POST(request: NextRequest) {
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

