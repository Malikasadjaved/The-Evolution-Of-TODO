/**
 * ChatKit Page - OpenAI Official ChatKit Implementation
 *
 * This page demonstrates OpenAI's official ChatKit component as an alternative
 * to our custom chat interface. Both interfaces connect to the same backend.
 *
 * Constitution: .specify/memory/phase-3-constitution.md (v1.1.0)
 * Spec: specs/002-ai-chatbot-mcp/spec.md Section 8.3 (Hybrid UI Approach)
 *
 * Purpose (Option 3 - Hybrid Approach):
 * - Provides hackathon compliance with OpenAI ChatKit requirement
 * - Demonstrates knowledge of both custom and official implementations
 * - Shows initiative by implementing multiple UI approaches
 * - Allows judges to compare custom vs ChatKit UX
 *
 * Features:
 * - Official OpenAI ChatKit component
 * - Same backend API as custom UI (/api/{user_id}/chat)
 * - JWT authentication (shared with Phase 2 web UI)
 * - Real-time conversation with MCP tools
 * - ChatGPT-style message display
 *
 * Navigation:
 * - Custom UI: http://localhost:3001/ (main)
 * - ChatKit UI: http://localhost:3001/chatkit (this page)
 */

import React, { useState, useEffect } from "react";
import Head from "next/head";
import { ChatKit } from "@/components/ChatKit";
import { isAuthenticated, getAPIBaseURL } from "@/lib/api";

// ============================================================================
// Types
// ============================================================================

interface ChatKitMessage {
  role: "user" | "assistant";
  content: string;
}

// ============================================================================
// ChatKit Page Component
// ============================================================================

export default function ChatKitPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatKitMessage[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);

  // ============================================================================
  // Authentication Check on Mount
  // ============================================================================

  useEffect(() => {
    // Step 1: Check if auth_token is in URL parameters (from dashboard)
    const urlParams = new URLSearchParams(window.location.search);
    const authTokenFromUrl = urlParams.get("auth_token");

    if (authTokenFromUrl) {
      localStorage.setItem("auth_token", authTokenFromUrl);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Step 2: Check if user is authenticated
    if (!isAuthenticated()) {
      setError("Please log in to access the chatbot.");
      setIsLoading(false);

      setTimeout(() => {
        const returnUrl = encodeURIComponent("http://localhost:3001/chatkit");
        window.location.href = `http://localhost:3000/login?redirect_to=${returnUrl}`;
      }, 2000);
      return;
    }

    // Step 3: Extract user ID from JWT token
    const extractedUserId = getUserIdFromToken();

    if (!extractedUserId) {
      setError("Failed to extract user information. Please log in again.");
      setIsLoading(false);
      return;
    }

    setUserId(extractedUserId);
    setIsLoading(false);
  }, []);

  // ============================================================================
  // Extract User ID from JWT Token
  // ============================================================================

  function getUserIdFromToken(): string | null {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        console.error("No auth token found in localStorage");
        return null;
      }

      const parts = token.split(".");
      if (parts.length !== 3) {
        console.error("Invalid JWT token format");
        return null;
      }

      const payload = JSON.parse(atob(parts[1]));
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
  // Handle Message Send
  // ============================================================================

  const handleSendMessage = async (message: string) => {
    if (!userId) {
      setError("User not authenticated");
      return;
    }

    // Add user message to UI immediately
    setMessages((prev) => [...prev, { role: "user", content: message }]);

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setError("Authentication required. Please log in.");
        return;
      }

      // Call backend /api/chat endpoint
      const response = await fetch(
        `${getAPIBaseURL()}/api/${userId}/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message,
            conversation_id: conversationId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();

        if (response.status === 401) {
          setError("Session expired. Please log in again.");
          localStorage.removeItem("auth_token");
          return;
        }

        if (response.status === 403) {
          setError("Access denied. You can only access your own conversations.");
          return;
        }

        if (response.status === 500) {
          const errorMessage =
            typeof errorData.detail === "string"
              ? errorData.detail
              : errorData.detail?.error || "Server error occurred";
          setError(`Service temporarily unavailable: ${errorMessage}`);
          return;
        }

        const errorMessage =
          typeof errorData.detail === "string"
            ? errorData.detail
            : "Failed to send message";
        setError(errorMessage);
        return;
      }

      const data = await response.json();

      // Update conversation ID if new
      if (!conversationId && data.conversation_id) {
        setConversationId(data.conversation_id);
      }

      // Add assistant response
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message },
      ]);
    } catch (err) {
      console.error("Chat error:", err);

      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError(
          "Cannot connect to server. Please check your internet connection."
        );
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    }
  };

  // ============================================================================
  // Render Loading State
  // ============================================================================

  if (isLoading) {
    return (
      <>
        <Head>
          <title>AI Task Manager (ChatKit) - Loading...</title>
          <meta name="description" content="AI-powered task management chatbot" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <div style={styles.loadingContainer}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Loading ChatKit...</p>
        </div>
      </>
    );
  }

  // ============================================================================
  // Render Error State (Authentication Failed)
  // ============================================================================

  if (error && !userId) {
    return (
      <>
        <Head>
          <title>AI Task Manager (ChatKit) - Authentication Required</title>
          <meta name="description" content="AI-powered task management chatbot" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <div style={styles.errorContainer}>
          <div style={styles.errorContent}>
            <h1 style={styles.errorTitle}>Authentication Required</h1>
            <p style={styles.errorMessage}>{error}</p>
            <p style={styles.redirectMessage}>Redirecting to login page...</p>
            <a href="http://localhost:3000/login" style={styles.loginLink}>
              Click here if not redirected automatically
            </a>
          </div>
        </div>
      </>
    );
  }

  // ============================================================================
  // Render ChatKit Interface
  // ============================================================================

  return (
    <>
      <Head>
        <title>AI Task Manager (ChatKit)</title>
        <meta
          name="description"
          content="Manage your tasks with AI - OpenAI ChatKit implementation"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header with Navigation */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.headerTitle}>AI Task Manager (ChatKit)</h1>
          <div style={styles.headerActions}>
            <a href="/" style={styles.customUILink}>
              Custom UI
            </a>
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

      {/* Main ChatKit Container */}
      <main style={styles.main}>
        <div style={styles.chatContainer}>
          {/* Info Banner */}
          <div style={styles.infoBanner}>
            <p style={styles.infoBannerText}>
              ℹ️ <strong>OpenAI ChatKit Implementation</strong> - This interface
              uses the official ChatKit component. Switch to{" "}
              <a href="/" style={styles.infoBannerLink}>
                Custom UI
              </a>{" "}
              to see our glassmorphism design.
            </p>
          </div>

          {/* ChatKit Component */}
          <ChatKit
            messages={messages}
            onSendMessage={handleSendMessage}
            placeholder="Type your message here (e.g., 'Add a task to buy groceries tomorrow')"
            // domainKey={process.env.NEXT_PUBLIC_OPENAI_DOMAIN_KEY} // Only needed in production
          />

          {/* Error Display */}
          {error && userId && (
            <div style={styles.errorBannerBottom}>
              <span style={styles.errorIcon}>⚠️</span>
              <span style={styles.errorMessage}>{error}</span>
              <button
                style={styles.errorDismiss}
                onClick={() => setError(null)}
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <p style={styles.footerText}>
          Phase 3: AI Chatbot with MCP Architecture | OpenAI ChatKit
        </p>
        <p style={styles.footerSubtext}>
          <a href="/" style={styles.footerLink}>
            Custom UI
          </a>
          {" | "}
          <a href="/chatkit" style={styles.footerLinkActive}>
            ChatKit UI (current)
          </a>
          {" | "}
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
// Inline Styles
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
    maxWidth: "1200px",
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
  customUILink: {
    padding: "8px 16px",
    background: "#10b981",
    color: "white",
    textDecoration: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 500,
    transition: "background 0.2s",
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
    minHeight: "calc(100vh - 120px)",
    background: "#f9fafb",
  },
  chatContainer: {
    maxWidth: "900px",
    margin: "0 auto",
    height: "calc(100vh - 120px)",
    display: "flex",
    flexDirection: "column" as const,
  },

  // Info Banner
  infoBanner: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "8px",
    padding: "12px 16px",
    margin: "16px 20px 0",
  },
  infoBannerText: {
    fontSize: "14px",
    color: "#1e40af",
    margin: 0,
  },
  infoBannerLink: {
    color: "#2563eb",
    textDecoration: "underline",
    fontWeight: 500,
  },

  // Error Banner (Bottom)
  errorBannerBottom: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    margin: "0 20px 16px",
  },
  errorIcon: {
    fontSize: "18px",
  },
  errorDismiss: {
    marginLeft: "auto",
    background: "transparent",
    border: "none",
    color: "#dc2626",
    fontSize: "18px",
    cursor: "pointer",
    padding: "4px",
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
  footerLinkActive: {
    color: "#10b981",
    textDecoration: "none",
    fontWeight: 600,
  },
};
