import { NextRequest, NextResponse } from "next/server";

const VERCEL_TOKEN = process.env.VERCEL_DEPLOY_TOKEN!;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID!;
const TEAM_ID = process.env.VERCEL_TEAM_ID!;

async function upsertEnvVar(key: string, value: string) {
  const listRes = await fetch(
    `https://api.vercel.com/v9/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`,
    { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } }
  );
  const { envs } = await listRes.json();
  const existing = (envs as Array<{ key: string; id: string }>).find((e) => e.key === key);

  if (existing) {
    await fetch(
      `https://api.vercel.com/v9/projects/${PROJECT_ID}/env/${existing.id}?teamId=${TEAM_ID}`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${VERCEL_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      }
    );
  } else {
    await fetch(
      `https://api.vercel.com/v10/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${VERCEL_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ key, value, type: "encrypted", target: ["production", "preview"] }),
      }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { subscription, name } = await req.json();
    if (!subscription?.endpoint || !name) {
      return NextResponse.json({ error: "Missing subscription or name" }, { status: 400 });
    }

    const key = `PUSH_SUB_${name.toUpperCase().replace(/[^A-Z]/g, "")}`;
    await upsertEnvVar(key, JSON.stringify(subscription));

    return NextResponse.json({ ok: true, key });
  } catch (err) {
    console.error("subscribe error", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
