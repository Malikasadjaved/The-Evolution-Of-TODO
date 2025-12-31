"""
MCP (Model Context Protocol) Package for Phase 3

This package implements the MCP server and tools for the AI Chatbot interface.

Components:
- server.py: MCP server entry point
- schemas.py: Pydantic input/output models for tool calls
- tools/: MCP tool implementations (add_task, list_tasks, complete_task, update_task, delete_task)
- utils/: Utilities (ConversationManager, CircuitBreaker, StructuredLogger)

Architecture:
- Stateless: No client-side state management
- Single Endpoint: All interactions via POST /api/chat/{user_id}
- MCP Boundary: Tools are the ONLY interface between agent and database
- User Isolation: All tools enforce user_id filtering via JWT

Constitution: .specify/memory/phase-3-constitution.md (v1.1.0)
Spec: specs/002-ai-chatbot-mcp/spec.md
"""

__version__ = "1.0.0"
__all__ = ["server", "schemas", "tools", "utils"]
