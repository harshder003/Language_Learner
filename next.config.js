/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Vercel serverless functions configuration
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig

