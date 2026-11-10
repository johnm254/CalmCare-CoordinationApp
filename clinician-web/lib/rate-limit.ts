/**
 * Lightweight in-memory sliding-window rate limiter.
 * Suitable for a single-instance deployment; replace the store with Redis
 * (e.g. @upstash/ratelimit) when you scale horizontally.
 */

interface Window {
  count: number;
  resetAt: number;
}

const store = new Map<string, Window>();

// Prune stale keys every 5 minutes to avoid unbounded memory growth.
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, win] of store) {
      if (win.resetAt < now) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitOptions {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Window duration in seconds */
  windowSec: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const { limit, windowSec } = options;
  const now = Date.now();
  const windowMs = windowSec * 1000;

  let win = store.get(key);
  if (!win || win.resetAt <= now) {
    win = { count: 0, resetAt: now + windowMs };
    store.set(key, win);
  }

  win.count += 1;
  const success = win.count <= limit;
  return { success, remaining: Math.max(0, limit - win.count), resetAt: win.resetAt };
}

/** Extract the real IP from Next.js request headers */
export function getIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    headers.get('x-real-ip') ??
    'unknown'
  );
}
