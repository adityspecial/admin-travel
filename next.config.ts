import type { NextConfig } from 'next'

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:3000'

const nextConfig: NextConfig = {
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
