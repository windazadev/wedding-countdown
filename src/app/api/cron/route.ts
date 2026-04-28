import webpush from "web-push";
import { NextRequest, NextResponse } from "next/server";
import { getDailyQuote, getColombiaCalendarDays } from "@/lib/utils";
import { getAllSubscriptions, deleteSubscription } from "@/lib/subscriptions";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Send a push notification with retry logic for transient failures.
 * Returns { ok: true } on success, or { ok: false, statusCode, detail } on final failure.
 */
async function sendWithRetry(
  sub: Parameters<typeof webpush.sendNotification>[0],
  payload: string,
  options: webpush.RequestOptions
): Promise<{ ok: boolean; statusCode?: number; detail?: string }> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await webpush.sendNotification(sub, payload, options);
      return { ok: true };
    } catch (err: unknown) {
      const e = err as { statusCode?: number; body?: string; message?: string };
      const code = e.statusCode ?? 0;

      // Permanent failures — don't retry
      if (code === 404 || code === 410 || code === 400 || code === 401 || code === 403) {
        return { ok: false, statusCode: code, detail: e.body ?? e.message };
      }

      // Transient failures (429, 5xx, network errors) — retry
      if (attempt < MAX_RETRIES) {
        console.log(
          `[cron] Push attempt ${attempt}/${MAX_RETRIES} failed (${code}), retrying in ${RETRY_DELAY_MS}ms...`
        );
        await sleep(RETRY_DELAY_MS * attempt); // exponential backoff
      } else {
        return {
          ok: false,
          statusCode: code,
          detail: `Failed after ${MAX_RETRIES} attempts: ${e.body ?? e.message}`,
        };
      }
    }
  }
  return { ok: false, detail: "Unexpected retry loop exit" };
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  webpush.setVapidDetails(
    "mailto:edwindaza.ui@gmail.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const days = getColombiaCalendarDays();
  const quote = getDailyQuote();

  const title =
    days === 0 ? "¡Hoy es el día, mi amor! ♡" : `Mi amor, faltan ${days} días ♡`;

  const payload = JSON.stringify({
    title,
    body: quote,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-96.png",
    url: "/#frase",
  });

  const subs = await getAllSubscriptions();

  if (subs.length === 0) {
    return NextResponse.json({
      ok: true,
      sent: 0,
      note: "No subscriptions found in Blob storage",
    });
  }

  let sent = 0;
  let failed = 0;
  const purged: string[] = [];
  const errors: { name: string; statusCode?: number; detail?: string }[] = [];

  const sendOptions: webpush.RequestOptions = {
    TTL: 60 * 60 * 12,
    urgency: "high" as const,
  };

  for (const { name, sub } of subs) {
    const result = await sendWithRetry(sub, payload, sendOptions);
    if (result.ok) {
      sent++;
    } else {
      failed++;
      errors.push({ name, statusCode: result.statusCode, detail: result.detail });
      // Purge expired/gone subscriptions
      if (result.statusCode === 404 || result.statusCode === 410) {
        await deleteSubscription(name);
        purged.push(name);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    sent,
    failed,
    purged,
    errors,
    subscribers: subs.length,
    days,
    quote,
    storage: "blob",
  });
}
