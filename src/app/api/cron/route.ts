import webpush from "web-push";
import { head } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { getTimeLeft, getDailyQuote, WEDDING_DATE } from "@/lib/utils";

webpush.setVapidDetails(
  "mailto:edwindaza.ui@gmail.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

async function getSubscriptions(): Promise<PushSubscriptionJSON[]> {
  try {
    const { url } = await head("push-subscriptions.json");
    const res = await fetch(url, { cache: "no-store" });
    return await res.json();
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const time = getTimeLeft(WEDDING_DATE);
  const quote = getDailyQuote();
  const subs = await getSubscriptions();

  const payload = JSON.stringify({
    title: `Edwin & Yeimy · ${time.days} días`,
    body: time.days === 0
      ? "¡Hoy es el día más especial de nuestras vidas!"
      : `Faltan ${time.days} días, ${time.hours} horas. "${quote}"`,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-96.png",
    url: "/",
  });

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(sub as Parameters<typeof webpush.sendNotification>[0], payload)
    )
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({ ok: true, sent, failed, subscribers: subs.length });
}
