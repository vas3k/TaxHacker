import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // TODO: fixme
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "256mb",
    },
  },
}

export default nextConfig
