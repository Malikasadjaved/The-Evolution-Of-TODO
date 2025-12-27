"""
MCP Utilities Package

This package contains utility classes and functions for the MCP server:

1. ConversationManager (T015)
   - Load conversation history from database
   - Compress history when exceeding MAX_CONTEXT_TOKENS (8000)
   - Keep last 10 messages + summarize older ones

2. CircuitBreaker (T017)
   - Protect against cascading failures to OpenAI API
   - Track failure rates and open circuit when threshold exceeded
   - Automatic recovery after timeout

3. StructuredLogger (T018)
   - JSON logging for cloud-native observability
   - PII protection (hash user_id, redact sensitive fields)
   - Log levels: DEBUG, INFO, WARNING, ERROR

Constitution: .specify/memory/phase-3-constitution.md (v1.1.0)
Spec: specs/002-ai-chatbot-mcp/spec.md Section 6 (Cloud-Native Requirements)
"""

# Utility implementations will be added in Phase 2 (Foundational)
# T015: ConversationManager
# T017: CircuitBreaker
# T018: StructuredLogger
