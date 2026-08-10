import { redisIncr } from './redis'

// Fixed-window rate limit — same shape as backend/lib/rateLimit.ts. Returns
// true when the caller has exceeded `max` hits within the last `windowSec`
// seconds and should be rejected.
export async function isRateLimited(
  key: string,
  opts: { windowSec: number; max: number }
): Promise<boolean> {
  const count = await redisIncr(`admin-ratelimit:${key}`, opts.windowSec)
  return count > opts.max
}
