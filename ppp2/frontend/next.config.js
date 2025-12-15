/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Environment variables that should be exposed to the browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },

  // Enable experimental features if needed
  experimental: {
    // Add any experimental features here as needed
  },

  // Webpack configuration (if needed for custom loaders)
  webpack: (config) => {
    return config;
  },
};

module.exports = nextConfig;
