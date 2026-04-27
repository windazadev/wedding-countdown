import webpush from "web-push";
import { NextRequest, NextResponse } from "next/server";
import { getDailyQuote, getColombiaCalendarDays } from "@/lib/utils";
import { getAllSubscriptions } from "@/lib/subscriptions";

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

  const results = await Promise.allSettled(
    subs.map(({ sub }) => webpush.sendNotification(sub, payload))
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({ ok: true, sent, failed, subscribers: subs.length, days, quote });
}
