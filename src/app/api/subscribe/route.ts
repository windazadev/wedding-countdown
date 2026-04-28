import { NextRequest, NextResponse } from "next/server";
import { saveSubscription } from "@/lib/subscriptions";

export async function POST(req: NextRequest) {
  try {
    const { subscription, name } = await req.json();
    if (!subscription?.endpoint || !name) {
      return NextResponse.json(
        { error: "Missing subscription or name" },
        { status: 400 }
      );
    }

    const saved = await saveSubscription(name, subscription);
    if (!saved) {
      return NextResponse.json(
        { error: "Failed to save subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, name: name.toUpperCase() });
  } catch (err) {
    console.error("subscribe error", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
