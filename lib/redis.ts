import Redis from 'ioredis'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

// Same eager-connect + no-offline-queue setup as backend/lib/redis/client.ts —
// a command fired before a lazy connection finishes would fail immediately
// instead of queuing, silently degrading every request to the in-memory
// fallback right after a restart.
const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 0,
  enableOfflineQueue:   false,
  connectTimeout:       400,
  retryStrategy:        () => null,
})

redis.on('error', () => { /* silently swallow — fall through to memCache */ })

// In-memory fallback — same shape as backend's, but this only protects a
// single instance. On Netlify's serverless functions each cold start gets
// its own empty Map, so Redis being reachable is what actually makes the
// rate limit hold across instances; this fallback just avoids a hard outage
// if Redis itself is briefly unavailable.
const memCounters = new Map<string, { count: number; expiresAt: number }>()

function memIncr(key: string, ttlSeconds: number): number {
  const now = Date.now()
  const e = memCounters.get(key)
  if (!e || now > e.expiresAt) {
    memCounters.set(key, { count: 1, expiresAt: now + ttlSeconds * 1000 })
    return 1
  }
  e.count += 1
  return e.count
}

export async function redisIncr(key: string, ttlSeconds: number): Promise<number> {
  try {
    const count = await redis.incr(key)
    if (count === 1) await redis.expire(key, ttlSeconds)
    return count
  } catch {
    return memIncr(key, ttlSeconds)
  }
}
