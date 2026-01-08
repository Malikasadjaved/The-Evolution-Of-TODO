/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',  // Optimized production build

  // Uncomment if using environment variables in client-side code
  // env: {
  //   NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  // },

  // Uncomment if you need to allow images from external domains
  // images: {
  //   domains: ['example.com'],
  // },
}

module.exports = nextConfig
