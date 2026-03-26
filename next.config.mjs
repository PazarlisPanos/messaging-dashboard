/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['pg', 'pg-pool', 'pg-connection-string'],
  },
}

export default nextConfig
