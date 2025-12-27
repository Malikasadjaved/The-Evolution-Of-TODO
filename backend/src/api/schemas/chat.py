"""
Pydantic schemas for chat endpoint.

Request/response models for POST /api/{user_id}/chat endpoint.

Constitution: .specify/memory/phase-3-constitution.md (v1.1.0)
Spec: specs/002-ai-chatbot-mcp/spec.md Section 4.1
"""

from pydantic import BaseModel, Field
from typing import Optional


class ChatRequest(BaseModel):
    """
    Request body for chat endpoint.

    Attributes:
        message: User's message (required, 1-10000 characters)
        conversation_id: Optional conversation ID to continue existing conversation
    """

    message: str = Field(..., min_length=1, max_length=10000, description="User's message")
    conversation_id: Optional[int] = Field(None, description="Existing conversation ID (optional)")


class ChatResponse(BaseModel):
    """
    Response body for chat endpoint.

    Attributes:
        message: Assistant's response message
        conversation_id: Conversation ID (new or existing)
    """

    message: str = Field(..., description="Assistant's response")
    conversation_id: int = Field(..., description="Conversation ID")
