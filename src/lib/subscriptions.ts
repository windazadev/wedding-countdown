import { put, get, list, del } from "@vercel/blob";
import webpush from "web-push";

export type PushSub = Parameters<typeof webpush.sendNotification>[0];

const BLOB_PREFIX = "push-subs/";

function blobPath(name: string): string {
  return `${BLOB_PREFIX}${name.toUpperCase().replace(/[^A-Z]/g, "")}.json`;
}

/**
 * Get a subscription from Vercel Blob (reads at runtime, not deploy time).
 * Uses get() which handles auth for private blob stores.
 */
export async function getSubscription(name: string): Promise<PushSub | null> {
  try {
    const path = blobPath(name);
    const { blobs } = await list({ prefix: path, limit: 1 });
    if (blobs.length === 0) return null;

    const blob = await get(blobs[0].url, { access: "private" });
    if (!blob || !blob.stream) return null;
    const reader = blob.stream.getReader();
    const chunks: Uint8Array[] = [];
    let done = false;
    while (!done) {
      const result = await reader.read();
      if (result.value) chunks.push(result.value);
      done = result.done;
    }
    const text = new TextDecoder().decode(
      chunks.reduce((acc, c) => new Uint8Array([...acc, ...c]), new Uint8Array())
    );
    return JSON.parse(text) as PushSub;
  } catch (err) {
    console.error(`[subscriptions] getSubscription(${name}) error:`, err);
    return null;
  }
}

/**
 * Save or update a subscription in Vercel Blob.
 */
export async function saveSubscription(
  name: string,
  subscription: PushSub
): Promise<boolean> {
  try {
    const path = blobPath(name);

    // Delete any existing blob for this name first (upsert)
    const { blobs } = await list({ prefix: path, limit: 10 });
    if (blobs.length > 0) {
      await del(blobs.map((b) => b.url));
    }

    await put(path, JSON.stringify(subscription), {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
    });
    return true;
  } catch (err) {
    console.error(`[subscriptions] saveSubscription(${name}) error:`, err);
    return false;
  }
}

/**
 * Get all known subscriptions.
 */
export async function getAllSubscriptions(): Promise<
  { name: string; sub: PushSub }[]
> {
  const names = ["EDWIN", "YEIMY"];
  const results: { name: string; sub: PushSub }[] = [];
  for (const name of names) {
    const sub = await getSubscription(name);
    if (sub) results.push({ name, sub });
  }
  return results;
}

/**
 * Delete a subscription from Vercel Blob.
 */
export async function deleteSubscription(name: string): Promise<boolean> {
  try {
    const path = blobPath(name);
    const { blobs } = await list({ prefix: path, limit: 10 });
    if (blobs.length === 0) return false;
    await del(blobs.map((b) => b.url));
    return true;
  } catch (err) {
    console.error(`[subscriptions] deleteSubscription(${name}) error:`, err);
    return false;
  }
}
