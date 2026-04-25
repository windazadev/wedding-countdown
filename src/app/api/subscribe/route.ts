import { put, head, getDownloadUrl } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

const BLOB_KEY = "push-subscriptions.json";

async function readSubscriptions(): Promise<PushSubscriptionJSON[]> {
  try {
    const { url } = await head(BLOB_KEY);
    const res = await fetch(url);
    return await res.json();
  } catch {
    return [];
  }
}

async function writeSubscriptions(subs: PushSubscriptionJSON[]) {
  await put(BLOB_KEY, JSON.stringify(subs), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });
}

export async function POST(req: NextRequest) {
  try {
    const sub: PushSubscriptionJSON = await req.json();
    if (!sub?.endpoint) return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });

    const existing = await readSubscriptions();
    const filtered = existing.filter((s) => s.endpoint !== sub.endpoint);
    await writeSubscriptions([...filtered, sub]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("subscribe error", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
