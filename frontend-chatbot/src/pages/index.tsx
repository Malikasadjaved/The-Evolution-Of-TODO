/**
 * Main Chat Page - Phase 3 AI Chatbot Frontend
 *
 * This is the main entry point for the AI-powered task management chatbot.
 * Users interact with their tasks through natural language conversations.
 *
 * Constitution: .specify/memory/phase-3-constitution.md (v1.1.0)
 * Spec: specs/002-ai-chatbot-mcp/spec.md Section 8.3 (Main Chat Page)
 *
 * Features:
 * - Natural language task creation ("Add a task to buy groceries tomorrow")
 * - Task queries ("Show me all high priority tasks")
 * - Context-aware interactions ("Mark the first one as complete")
 * - Multi-turn conversations with history
 * - JWT authentication (shared with Phase 2 web UI)
 *
 * Integration with Phase 2:
 * - Same Better Auth JWT tokens
 * - Same Neon PostgreSQL database
 * - Real-time task synchronization
 * - Tasks created via chatbot appear in Phase 2 web UI immediately
 *
 * Usage:
 * - User must be logged in via Better Auth (JWT token in localStorage)
 * - If not authenticated, redirect to Phase 2 login page
 * - Once authenticated, ChatInterface component loads automatically
 */

import React, { useState, useEffect } from "react";
import Head from "next/head";
import ChatInterface from "@/components/ChatInterface";
import { isAuthenticated, getAPIBaseURL } from "@/lib/api";

// ============================================================================
// Main Chat Page Component
// ============================================================================

export default function ChatPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // Authentication Check on Mount
  // ============================================================================

  useEffect(() => {
    // Step 1: Check if auth_token is in URL parameters (from dashboard)
    const urlParams = new URLSearchParams(window.location.search);
    const authTokenFromUrl = urlParams.get("auth_token");

    if (authTokenFromUrl) {
      // Save token to localStorage for session sharing
      localStorage.setItem("auth_token", authTokenFromUrl);

      // Remove token from URL for security (redirect to clean URL)
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Step 2: Check if user is authenticated
    if (!isAuthenticated()) {
      // Redirect to Phase 2 login page with return URL
      setError("Please log in to access the chatbot.");
      setIsLoading(false);

      // Redirect to login after 2 seconds, with redirect_to parameter
      setTimeout(() => {
        const returnUrl = encodeURIComponent("http://localhost:3001");
        window.location.href = `http://localhost:3000/login?redirect_to=${returnUrl}`;
      }, 2000);
      return;
    }

    // Step 3: Extract user ID from JWT token
    const mockUserId = getUserIdFromToken();

    if (!mockUserId) {
      setError("Failed to extract user information. Please log in again.");
      setIsLoading(false);
      return;
    }

    setUserId(mockUserId);
    setIsLoading(false);
  }, []);

  // ============================================================================
  // Extract User ID from JWT Token
  // ============================================================================

  /**
   * Extract user ID from JWT token payload
   *
   * In production, this would properly decode the JWT token.
   * For development/testing, we can use a mock user ID.
   *
   * @returns User ID or null if extraction fails
   */
  function getUserIdFromToken(): string | null {
    try {
      // Get JWT token from localStorage
      const token = localStorage.getItem("auth_token");
      if (!token) {
        console.error("No auth token found in localStorage");
        return null;
      }

      // Decode JWT token (JWT format: header.payload.signature)
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error("Invalid JWT token format");
        return null;
      }

      // Decode the payload (base64url encoded)
      const payload = JSON.parse(atob(parts[1]));

      // Extract user_id from payload
      const userId = payload.user_id || payload.sub;

      if (!userId) {
        console.error("No user_id found in JWT token payload");
        return null;
      }

      return userId;
    } catch (error) {
      console.error("Failed to extract user ID from token:", error);
      return null;
    }
  }

  // ============================================================================
  // Render Loading State
  // ============================================================================

  if (isLoading) {
    return (
      <>
        <Head>
          <title>AI Task Manager - Loading...</title>
          <meta name="description" content="AI-powered task management chatbot" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <div style={styles.loadingContainer}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Loading chatbot...</p>
        </div>
      </>
    );
  }

  // ============================================================================
  // Render Error State (Authentication Failed)
  // ============================================================================

  if (error || !userId) {
    return (
      <>
        <Head>
          <title>AI Task Manager - Authentication Required</title>
          <meta name="description" content="AI-powered task management chatbot" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <div style={styles.errorContainer}>
          <div style={styles.errorContent}>
            <h1 style={styles.errorTitle}>Authentication Required</h1>
            <p style={styles.errorMessage}>
              {error || "You must be logged in to access the AI Task Manager."}
            </p>
            <p style={styles.redirectMessage}>
              Redirecting to login page...
            </p>
            <a href="http://localhost:3000/login" style={styles.loginLink}>
              Click here if not redirected automatically
            </a>
          </div>
        </div>
      </>
    );
  }

  // ============================================================================
  // Render Chat Interface
  // ============================================================================

  return (
    <>
      <Head>
        <title>AI Task Manager - Chat</title>
        <meta
          name="description"
          content="Manage your tasks with AI-powered natural language conversations"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.headerTitle}>AI Task Manager</h1>
          <div style={styles.headerActions}>
            <a
              href="http://localhost:3000/dashboard"
              style={styles.webUILink}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Web UI
            </a>
            <button
              style={styles.logoutButton}
              onClick={() => {
                localStorage.clear();
                window.location.href = "http://localhost:3000/login";
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Chat Interface */}
      <main style={styles.main}>
        <ChatInterface userId={userId} apiBaseUrl={getAPIBaseURL()} />
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <p style={styles.footerText}>
          Phase 3: AI Chatbot with MCP Architecture | Powered by OpenAI Agents
          SDK
        </p>
        <p style={styles.footerSubtext}>
          Tasks sync in real-time with{" "}
          <a
            href="http://localhost:3000"
            style={styles.footerLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            Phase 2 Web UI
          </a>
        </p>
      </footer>
    </>
  );
}

// ============================================================================
// Inline Styles (will be moved to global CSS or Tailwind in production)
// ============================================================================

const styles = {
  // Loading State
  loadingContainer: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    background: "#f9fafb",
  },
  spinner: {
    width: "48px",
    height: "48px",
    border: "4px solid #e5e7eb",
    borderTopColor: "#3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    marginTop: "16px",
    fontSize: "16px",
    color: "#6b7280",
  },

  // Error State
  errorContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    background: "#f9fafb",
  },
  errorContent: {
    textAlign: "center" as const,
    padding: "40px",
    maxWidth: "500px",
  },
  errorTitle: {
    fontSize: "24px",
    fontWeight: 600,
    color: "#1f2937",
    marginBottom: "16px",
  },
  errorMessage: {
    fontSize: "16px",
    color: "#6b7280",
    marginBottom: "12px",
  },
  redirectMessage: {
    fontSize: "14px",
    color: "#9ca3af",
    marginBottom: "20px",
  },
  loginLink: {
    display: "inline-block",
    padding: "10px 20px",
    background: "#3b82f6",
    color: "white",
    textDecoration: "none",
    borderRadius: "8px",
    fontWeight: 600,
    transition: "background 0.2s",
  },

  // Header
  header: {
    background: "white",
    borderBottom: "1px solid #e5e7eb",
    position: "sticky" as const,
    top: 0,
    zIndex: 10,
  },
  headerContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    maxWidth: "800px",
    margin: "0 auto",
    padding: "16px 20px",
  },
  headerTitle: {
    fontSize: "20px",
    fontWeight: 600,
    color: "#1f2937",
    margin: 0,
  },
  headerActions: {
    display: "flex",
    gap: "12px",
  },
  webUILink: {
    padding: "8px 16px",
    background: "#f3f4f6",
    color: "#374151",
    textDecoration: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 500,
    transition: "background 0.2s",
  },
  logoutButton: {
    padding: "8px 16px",
    background: "white",
    color: "#dc2626",
    border: "1px solid #fecaca",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "background 0.2s",
  },

  // Main Content
  main: {
    minHeight: "calc(100vh - 120px)", // Account for header and footer
  },

  // Footer
  footer: {
    background: "white",
    borderTop: "1px solid #e5e7eb",
    padding: "20px",
    textAlign: "center" as const,
  },
  footerText: {
    fontSize: "14px",
    color: "#6b7280",
    margin: "0 0 8px 0",
  },
  footerSubtext: {
    fontSize: "12px",
    color: "#9ca3af",
    margin: 0,
  },
  footerLink: {
    color: "#3b82f6",
    textDecoration: "none",
  },
};
