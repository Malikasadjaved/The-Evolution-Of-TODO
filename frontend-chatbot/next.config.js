/**
 * Next.js Configuration
 *
 * This file configures Next.js for the Phase 3 AI Chatbot frontend.
 *
 * Key settings:
 * - React strict mode enabled (development best practices)
 * - API rewrites to backend (proxy /api/* to FastAPI backend)
 * - Environment variable validation
 *
 * Constitution: .specify/memory/phase-3-constitution.md (v1.1.0)
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Enable SWC minification for faster builds
  swcMinify: true,

  // Output standalone for Docker builds
  // Creates a minimal production build in .next/standalone/
  output: 'standalone',

  // API Proxy Configuration (Development)
  // Proxies /api/* requests to the FastAPI backend
  // This avoids CORS issues during development
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },

  // Environment Variables Validation
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  // Image Optimization (future use)
  images: {
    domains: [],
  },

  // Webpack Configuration (if needed for custom builds)
  webpack: (config) => {
    return config;
  },
};

module.exports = nextConfig;
