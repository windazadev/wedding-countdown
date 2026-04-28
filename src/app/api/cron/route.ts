import webpush from "web-push";
import { NextRequest, NextResponse } from "next/server";
import { getDailyQuote, getColombiaCalendarDays } from "@/lib/utils";
import { getAllSubscriptions, deleteSubscription } from "@/lib/subscriptions";

const SEND_OPTIONS = {
  TTL: 60 * 60 * 12,
  urgency: "high" as const,
  topic: "wedding-daily",
};

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

  const title = days === 0 ? "¡Hoy es el día, mi amor! ♡" : `Mi amor, faltan ${days} días ♡`;

  const payload = JSON.stringify({
    title,
    body: quote,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-96.png",
    url: "/#frase",
  });

  const subs = await getAllSubscriptions();

  if (subs.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, note: "No subscriptions yet" });
  }

  let sent = 0;
  let failed = 0;
  const purged: string[] = [];
  const errors: { name: string; statusCode?: number; detail?: string }[] = [];

  for (const { name, sub } of subs) {
    try {
      await webpush.sendNotification(sub, payload, SEND_OPTIONS);
      sent++;
    } catch (err: unknown) {
      failed++;
      const e = err as { statusCode?: number; body?: string; message?: string };
      errors.push({ name, statusCode: e.statusCode, detail: e.body ?? e.message });
      if (e.statusCode === 404 || e.statusCode === 410) {
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
  });
}
