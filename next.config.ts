import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // TODO: fixme
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "64mb",
    },
  },
}

export default nextConfig
