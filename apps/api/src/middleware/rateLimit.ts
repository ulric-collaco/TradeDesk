import type { Context, Next } from 'hono';
import type { Env, AppVariables } from '../types/index';
import { errorResponse } from '../types/index';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  limit: number;
  windowSeconds: number;
  keyFn: (c: Context<{ Bindings: Env; Variables: AppVariables }>) => string;
}

function createRateLimiter(config: RateLimitConfig) {
  return async (
    c: Context<{ Bindings: Env; Variables: AppVariables }>,
    next: Next
  ): Promise<Response | void> => {
    const identifier = config.keyFn(c);
    const kvKey = `rl:${identifier}`;
    const now = Math.floor(Date.now() / 1000);

    const raw = await c.env.KV.get(kvKey);
    let entry: RateLimitEntry = raw
      ? (JSON.parse(raw) as RateLimitEntry)
      : { count: 0, resetAt: now + config.windowSeconds };

    // Reset window if expired
    if (now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + config.windowSeconds };
    }

    if (entry.count >= config.limit) {
      const retryAfter = entry.resetAt - now;
      c.header('Retry-After', String(retryAfter));
      return c.json(
        errorResponse(
          'RATE_LIMITED',
          `Too many requests. Please wait ${retryAfter} seconds.`
        ),
        429
      );
    }

    entry.count++;
    const ttl = entry.resetAt - now;
    await c.env.KV.put(kvKey, JSON.stringify(entry), { expirationTtl: ttl });

    await next();
  };
}

function getClientIP(c: Context): string {
  return (
    c.req.header('CF-Connecting-IP') ??
    c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ??
    'unknown'
  );
}

// Auth routes: 10 req / 15 min by IP
export const authRateLimit = createRateLimiter({
  limit: 10,
  windowSeconds: 15 * 60,
  keyFn: (c) => `auth:${getClientIP(c)}`,
});

// POST /orders: 30 req / 1 min by user ID
export const orderCreateRateLimit = createRateLimiter({
  limit: 30,
  windowSeconds: 60,
  keyFn: (c) => `order:${c.get('userId') ?? getClientIP(c)}`,
});

// General: 200 req / 1 min by IP
export const generalRateLimit = createRateLimiter({
  limit: 200,
  windowSeconds: 60,
  keyFn: (c) => `general:${getClientIP(c)}`,
});
