/**
 * Minimal in-memory sliding-window rate limiter. No external service
 * (Redis, Upstash, etc.) required — good enough for a single-instance /
 * low-to-moderate-traffic deployment, and keeps the project dependency-free.
 *
 * Caveat: state lives in this Node.js process's memory. On a serverless
 * platform that spins up multiple concurrent instances, each instance
 * enforces its own limit rather than one global limit. If you outgrow
 * that, swap this for a shared store (Vercel KV / Upstash Redis) behind
 * the same `rateLimit()` function signature.
 */

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

// Opportunistic cleanup (runs at most every few minutes) so the map
// doesn't grow unbounded from one-off / long-departed clients.
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets) {
    bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
    if (bucket.timestamps.length === 0) buckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** How long the caller should wait before retrying, in whole seconds. */
  retryAfterSeconds: number;
}

/**
 * @param key unique identifier for the caller, e.g. `verify:203.0.113.4`
 * @param limit max requests allowed within the window
 * @param windowMs window size in milliseconds
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  cleanup(windowMs);
  const now = Date.now();
  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  if (bucket.timestamps.length >= limit) {
    buckets.set(key, bucket);
    const oldest = bucket.timestamps[0];
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((windowMs - (now - oldest)) / 1000),
    );
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return {
    allowed: true,
    remaining: limit - bucket.timestamps.length,
    retryAfterSeconds: 0,
  };
}

/**
 * Best-effort client IP extraction from common reverse-proxy headers
 * (Vercel, most CDNs). Falls back to "unknown" — in that case every
 * caller without a forwarded-for header shares one bucket, which still
 * caps worst-case abuse from a single misbehaving proxy setup.
 */
export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
