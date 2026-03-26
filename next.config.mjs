/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['pg', 'pg-pool', 'pg-connection-string'],
  },
  images: { unoptimized: true },
}

export default nextConfig
