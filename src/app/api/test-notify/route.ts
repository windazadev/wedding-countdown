import webpush from "web-push";
import { NextRequest, NextResponse } from "next/server";
import { getDailyQuote, getColombiaCalendarDays } from "@/lib/utils";
import { getSubscription } from "@/lib/subscriptions";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const name = (searchParams.get("name") ?? "Edwin").trim();

  webpush.setVapidDetails(
    "mailto:edwindaza.ui@gmail.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const sub = await getSubscription(name);
  if (!sub) {
    return NextResponse.json({ error: `No subscription found for ${name}` }, { status: 404 });
  }

  const days = getColombiaCalendarDays();
  const quote = getDailyQuote();
  const title = days === 0 ? "¡Hoy es el día, mi amor! ♡" : `Mi amor, faltan ${days} días ♡`;

  const payload = JSON.stringify({
    title,
    body: quote,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-96.png",
    url: "/#frase",
  });

  try {
    await webpush.sendNotification(sub, payload, {
      TTL: 60 * 60 * 12,
      urgency: "high",
      topic: "wedding-daily",
    });
    const endpointHost = (() => {
      try { return new URL((sub as { endpoint: string }).endpoint).host; } catch { return null; }
    })();
    return NextResponse.json({ ok: true, sent_to: name, endpointHost, days, quote });
  } catch (err: unknown) {
    const e = err as { statusCode?: number; body?: string; message?: string };
    return NextResponse.json({
      error: "Push failed",
      statusCode: e.statusCode,
      detail: e.body ?? e.message,
      hint: e.statusCode === 410 ? "Subscription expired — Yeimy needs to re-subscribe in the app" : undefined,
    }, { status: 500 });
  }
}
