import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // TODO: fixme
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
}

export default nextConfig
