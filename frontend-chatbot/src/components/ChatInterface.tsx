/**
 * ChatInterface Component - Main chat UI for Phase 3 AI Chatbot
 *
 * This component provides the complete chat experience:
 * - Displays conversation history (user + assistant messages)
 * - Input box for natural language task management
 * - Real-time message streaming
 * - Error handling with graceful fallbacks
 * - JWT authentication for all API calls
 *
 * Constitution: .specify/memory/phase-3-constitution.md (v1.1.0)
 * Spec: specs/002-ai-chatbot-mcp/spec.md Section 8.1 (Frontend ChatInterface)
 *
 * API Contract:
 * - Endpoint: POST /api/{user_id}/chat
 * - Request: { message: string, conversation_id?: number }
 * - Response: { message: string, conversation_id: number }
 * - Auth: JWT token in Authorization: Bearer <token> header
 *
 * Usage:
 * ```tsx
 * <ChatInterface userId="user_123" />
 * ```
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./ChatInterface.module.css";
import type { Message, ChatResponse, ErrorResponse } from "@/types";

// ============================================================================
// Component Props
// ============================================================================

interface ChatInterfaceProps {
  userId: string;
  apiBaseUrl?: string; // Default: http://localhost:8000
}

// ============================================================================
// ChatInterface Component
// ============================================================================

export default function ChatInterface({
  userId,
  apiBaseUrl = "http://localhost:8000",
}: ChatInterfaceProps) {
  // ============================================================================
  // State Management
  // ============================================================================

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // Auto-scroll to Bottom on New Messages
  // ============================================================================

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ============================================================================
  // JWT Token Retrieval
  // ============================================================================

  const getJWTToken = (): string | null => {
    // Try localStorage first (Better Auth stores token here)
    const token = localStorage.getItem("auth_token");
    if (token) {
      return token;
    }

    // Fallback: Check cookies (format: auth_token=...)
    const cookies = document.cookie.split("; ");
    const authCookie = cookies.find((c) => c.startsWith("auth_token="));
    if (authCookie) {
      return authCookie.split("=")[1];
    }

    return null;
  };

  // ============================================================================
  // Send Message to Backend
  // ============================================================================

  const sendMessage = async () => {
    // Validation: Empty message
    if (!inputValue.trim()) {
      setError("Message cannot be empty");
      return;
    }

    // Validation: JWT token required
    const token = getJWTToken();
    if (!token) {
      setError("Authentication required. Please log in.");
      return;
    }

    // Clear error state
    setError(null);

    // Add user message to UI immediately (optimistic update)
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Clear input
    const messageToSend = inputValue;
    setInputValue("");

    // Set loading state
    setIsLoading(true);

    try {
      // API Request
      const response = await fetch(`${apiBaseUrl}/api/${userId}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: messageToSend,
          conversation_id: conversationId,
        }),
      });

      // Handle HTTP errors
      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();

        // 401 Unauthorized - JWT token invalid or expired
        if (response.status === 401) {
          setError("Session expired. Please log in again.");
          // Clear stored token
          localStorage.removeItem("auth_token");
          throw new Error("Authentication failed");
        }

        // 403 Forbidden - User isolation violation
        if (response.status === 403) {
          setError("Access denied. You can only access your own conversations.");
          throw new Error("Authorization failed");
        }

        // 422 Validation Error
        if (response.status === 422) {
          setError("Invalid message format. Please try again.");
          throw new Error("Validation failed");
        }

        // 500 Server Error (OpenAI API failure, etc.)
        if (response.status === 500) {
          const errorMessage =
            typeof errorData.detail === "string"
              ? errorData.detail
              : errorData.detail?.error || "Server error occurred";
          setError(`Service temporarily unavailable: ${errorMessage}`);
          throw new Error("Server error");
        }

        // Other errors
        const errorMessage =
          typeof errorData.detail === "string"
            ? errorData.detail
            : "Failed to send message";
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      // Parse successful response
      const data: ChatResponse = await response.json();

      // Update conversation ID (first message creates new conversation)
      if (!conversationId && data.conversation_id) {
        setConversationId(data.conversation_id);
      }

      // Add assistant message to UI
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Chat error:", err);

      // Network error (backend unreachable)
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError(
          "Cannot connect to server. Please check your internet connection."
        );
      }

      // Error already handled above (don't override)
      // setError is already called in the error handling blocks
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // Keyboard Shortcuts
  // ============================================================================

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
    // Shift+Enter for new line (default textarea behavior)
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className={styles.chatInterface}>
      {/* ============================================================================
          Message History
          ============================================================================ */}
      <div className={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <h2>Welcome to AI Task Manager</h2>
            <p>
              Start a conversation to manage your tasks with natural language.
            </p>
            <div className={styles.examples}>
              <p>Try:</p>
              <ul>
                <li>&ldquo;Add a task to buy groceries tomorrow&rdquo;</li>
                <li>&ldquo;Show me all high priority tasks&rdquo;</li>
                <li>&ldquo;Mark the first task as complete&rdquo;</li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`${styles.message} ${
                  msg.role === "user" ? styles.messageUser : styles.messageAssistant
                }`}
                data-role={msg.role}
              >
                <div className={styles.messageHeader}>
                  <span className={styles.messageRole}>
                    {msg.role === "user" ? "You" : "AI Assistant"}
                  </span>
                  <span className={styles.messageTimestamp}>
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className={styles.messageContent}>{msg.content}</div>
              </div>
            ))}

            {/* Loading indicator while waiting for assistant response */}
            {isLoading && (
              <div className={`${styles.message} ${styles.messageAssistant}`} data-role="assistant">
                <div className={styles.messageHeader}>
                  <span className={styles.messageRole}>AI Assistant</span>
                </div>
                <div className={`${styles.messageContent} ${styles.typingIndicator}`}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}

            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* ============================================================================
          Error Display
          ============================================================================ */}
      {error && (
        <div className={styles.errorBanner} role="alert">
          <span className={styles.errorIcon}>⚠️</span>
          <span className={styles.errorMessage}>{error}</span>
          <button
            className={styles.errorDismiss}
            onClick={() => setError(null)}
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {/* ============================================================================
          Input Box
          ============================================================================ */}
      <div className={styles.inputContainer}>
        <textarea
          className={styles.messageInput}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
          disabled={isLoading}
          rows={3}
          maxLength={10000} // Match backend validation
          aria-label="Message input"
        />
        <button
          className={styles.sendButton}
          onClick={sendMessage}
          disabled={isLoading || !inputValue.trim()}
          aria-label="Send message"
        >
          {isLoading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}
