import type { NextConfig } from 'next'
import path from 'path'

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:3000'

console.log(`\x1b[35m[AirDunia]\x1b[0m \x1b[1mSuper Admin\x1b[0m  →  Backend: \x1b[36m${BACKEND}\x1b[0m`)

const nextConfig: NextConfig = {
  devIndicators: false,
  // Without this, Turbopack infers the monorepo root by walking up to the
  // nearest lockfile — it finds travel/package-lock.json one level up and
  // treats that as root, which breaks require() resolution for native
  // Node deps (e.g. enhanced-resolve, used by @tailwindcss/node) that live
  // correctly in this folder's own node_modules.
  turbopack: {
    root: path.join(__dirname),
  },
  experimental: {
    // Persistent Turbopack cache (default since v16.1) writes/compacts a
    // database to .next on every dev restart — measured 20-40s stalls and
    // extra memory on this machine's limited RAM. Trade cache reuse for a
    // smaller, more predictable footprint.
    turbopackFileSystemCacheForDev: false,
    // Don't eagerly load every route's JS into memory at server start.
    preloadEntriesOnStart: false,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
