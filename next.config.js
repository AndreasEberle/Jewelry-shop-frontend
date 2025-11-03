/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  },
  images: {
    domains: ['localhost', 'jewelry-shop-images.s3.eu-north-1.amazonaws.com'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8080',
        pathname: '/api/products/**',
      },
      {
        protocol: 'https',
        hostname: 'jewelry-shop-images.s3.eu-north-1.amazonaws.com',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig






