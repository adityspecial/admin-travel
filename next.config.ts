import type { NextConfig } from 'next'

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:3000'

console.log(`\x1b[35m[AirDunia]\x1b[0m \x1b[1mSuper Admin\x1b[0m  →  Backend: \x1b[36m${BACKEND}\x1b[0m`)

const nextConfig: NextConfig = {
  devIndicators: false,
  env: {
    BACKEND_URL: BACKEND,
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
