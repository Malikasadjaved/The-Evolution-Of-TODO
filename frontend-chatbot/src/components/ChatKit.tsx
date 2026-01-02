/**
 * ChatKit Component - Simple Chat Interface
 *
 * A lightweight chat UI component that mimics ChatKit functionality
 * while maintaining full control over styling and behavior.
 */

import React, { useState, useRef, useEffect } from 'react';

interface ChatKitProps {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  onSendMessage: (message: string) => Promise<void>;
  placeholder?: string;
}

export function ChatKit({ messages, onSendMessage, placeholder = "Type your message..." }: ChatKitProps) {
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isSending) return;

    const messageToSend = input.trim();
    setInput('');
    setIsSending(true);

    try {
      await onSendMessage(messageToSend);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Messages Area */}
      <div style={styles.messagesArea}>
        {messages.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyStateText}>
              👋 Start a conversation! Try: "Add a task to buy groceries tomorrow"
            </p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              style={{
                ...styles.messageWrapper,
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  ...styles.messageBubble,
                  ...(msg.role === 'user' ? styles.userBubble : styles.assistantBubble),
                }}
              >
                <p style={styles.messageText}>{msg.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} style={styles.inputForm}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={isSending}
          style={styles.input}
        />
        <button
          type="submit"
          disabled={!input.trim() || isSending}
          style={{
            ...styles.sendButton,
            ...((!input.trim() || isSending) && styles.sendButtonDisabled),
          }}
        >
          {isSending ? '⏳' : '➤'}
        </button>
      </form>
    </div>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: 'calc(100vh - 280px)',
    background: 'white',
    borderRadius: '12px',
    margin: '16px 20px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },

  messagesArea: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },

  emptyState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center' as const,
  },

  emptyStateText: {
    fontSize: '16px',
    color: '#9ca3af',
    margin: 0,
  },

  messageWrapper: {
    display: 'flex',
    alignItems: 'flex-start',
  },

  messageBubble: {
    maxWidth: '70%',
    padding: '12px 16px',
    borderRadius: '12px',
    wordWrap: 'break-word' as const,
  },

  userBubble: {
    background: '#3b82f6',
    color: 'white',
  },

  assistantBubble: {
    background: '#f3f4f6',
    color: '#1f2937',
  },

  messageText: {
    margin: 0,
    fontSize: '15px',
    lineHeight: '1.5',
  },

  inputForm: {
    display: 'flex',
    gap: '12px',
    padding: '16px 20px',
    borderTop: '1px solid #e5e7eb',
    background: '#f9fafb',
  },

  input: {
    flex: 1,
    padding: '12px 16px',
    fontSize: '15px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },

  sendButton: {
    padding: '12px 20px',
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    cursor: 'pointer',
    transition: 'background 0.2s',
    fontWeight: 600,
  },

  sendButtonDisabled: {
    background: '#9ca3af',
    cursor: 'not-allowed',
  },
};
