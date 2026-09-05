type RateLimitEntry = {
  count: number;
  windowStartedAt: number;
};

const entries = new Map<string, RateLimitEntry>();
const windowMs = 60 * 60 * 1000;
const maxRequests = 5;

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export function checkAnalyzeRateLimit(clientKey: string, now = Date.now()): RateLimitResult {
  const current = entries.get(clientKey);
  if (!current || now - current.windowStartedAt >= windowMs) {
    entries.set(clientKey, { count: 1, windowStartedAt: now });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= maxRequests) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((windowMs - (now - current.windowStartedAt)) / 1000)),
    };
  }

  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

// This in-memory limiter is intentionally simple for the demo and works per serverless instance.
// Production deployments should use a shared provider such as Vercel KV or Upstash Redis.
