import webpush from "web-push";

const VERCEL_TOKEN = process.env.VERCEL_DEPLOY_TOKEN!;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID!;
const TEAM_ID = process.env.VERCEL_TEAM_ID!;

export type PushSub = Parameters<typeof webpush.sendNotification>[0];

export async function getSubscription(name: string): Promise<PushSub | null> {
  const key = `PUSH_SUB_${name.toUpperCase().replace(/[^A-Z]/g, "")}`;
  try {
    const res = await fetch(
      `https://api.vercel.com/v9/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`,
      { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } }
    );
    const { envs } = await res.json();
    const entry = (envs as Array<{ key: string; id: string }>).find((e) => e.key === key);
    if (!entry) return null;

    const valRes = await fetch(
      `https://api.vercel.com/v9/projects/${PROJECT_ID}/env/${entry.id}?teamId=${TEAM_ID}`,
      { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } }
    );
    const { value } = await valRes.json();
    return JSON.parse(value) as PushSub;
  } catch {
    return null;
  }
}

export async function getAllSubscriptions(): Promise<{ name: string; sub: PushSub }[]> {
  const names = ["EDWIN", "YEIMY"];
  const results: { name: string; sub: PushSub }[] = [];
  for (const name of names) {
    const sub = await getSubscription(name);
    if (sub) results.push({ name, sub });
  }
  return results;
}

export async function deleteSubscription(name: string): Promise<boolean> {
  const key = `PUSH_SUB_${name.toUpperCase().replace(/[^A-Z]/g, "")}`;
  try {
    const res = await fetch(
      `https://api.vercel.com/v9/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`,
      { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } }
    );
    const { envs } = await res.json();
    const entry = (envs as Array<{ key: string; id: string }>).find((e) => e.key === key);
    if (!entry) return false;
    await fetch(
      `https://api.vercel.com/v9/projects/${PROJECT_ID}/env/${entry.id}?teamId=${TEAM_ID}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } }
    );
    return true;
  } catch {
    return false;
  }
}
