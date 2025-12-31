/**
 * Next.js App Component - Global Configuration
 *
 * This file wraps all pages and provides:
 * - Global CSS imports
 * - Global styles (animations, resets)
 * - Shared layout components (if any)
 * - Error boundaries (future)
 *
 * Constitution: .specify/memory/phase-3-constitution.md (v1.1.0)
 */

import type { AppProps } from "next/app";
import Head from "next/head";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Render Page Component */}
      <Component {...pageProps} />
    </>
  );
}
