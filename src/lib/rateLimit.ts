import { NextRequest } from 'next/server';

type Store = {
  incr: (key: string, ttlMs: number) => Promise<number>;
};

class InMemoryStore implements Store {
  private counts: Map<string, { count: number; expiresAt: number }> = new Map();

  async incr(key: string, ttlMs: number): Promise<number> {
    const now = Date.now();
    const entry = this.counts.get(key);
    if (!entry || entry.expiresAt < now) {
      const val = { count: 1, expiresAt: now + ttlMs };
      this.counts.set(key, val);
      return 1;
    }
    entry.count += 1;
    return entry.count;
  }
}

let store: Store | null = null;

async function getStore(): Promise<Store> {
  if (store) return store;
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (upstashUrl && upstashToken) {
    store = {
      async incr(key: string, ttlMs: number) {
        const nowSec = Math.floor(Date.now() / 1000);
        const expireSec = Math.floor(ttlMs / 1000);
        const url = `${upstashUrl}/pipeline`; // use pipeline for INCR + EXPIRE
        const body = JSON.stringify([
          ["INCR", key],
          ["EXPIRE", key, String(expireSec), "NX"],
        ]);
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${upstashToken}`,
            'Content-Type': 'application/json',
          },
          body,
        });
        if (!res.ok) throw new Error(`Upstash error: ${res.status}`);
        const data = await res.json();
        const incrResult = Array.isArray(data) ? data[0] : data.result?.[0];
        const value = Array.isArray(incrResult) ? incrResult[1] : incrResult?.result;
        return Number(value ?? 1);
      },
    } as Store;
    return store;
  }
  store = new InMemoryStore();
  return store;
}

export async function rateLimit(request: NextRequest, {
  max,
  windowMs,
  keyPrefix = 'rl',
}: { max: number; windowMs: number; keyPrefix?: string; }) {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const key = `${keyPrefix}:${ip}`;
  const s = await getStore();
  const count = await s.incr(key, windowMs);
  const remaining = Math.max(0, max - count);
  const limited = count > max;
  return { limited, remaining };
}


