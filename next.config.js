/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'example.com',
      },
    ],
  },
  serverExternalPackages: [
    '@emurgo/cardano-serialization-lib-nodejs',
    '@blockfrost/blockfrost-js',
    'nodemailer'
  ],
  // Empty turbopack config to work with Next.js 16
  turbopack: {}
};

module.exports = nextConfig;