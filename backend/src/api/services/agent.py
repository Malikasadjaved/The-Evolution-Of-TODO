# mypy: ignore-errors
"""
OpenAI Agent integration service.

This module handles communication with OpenAI Agents SDK.
The agent is responsible for:
1. Understanding user intent from natural language
2. Deciding which MCP tools to call
3. Extracting structured parameters for tool calls
4. Generating natural language responses

Constitution: .specify/memory/phase-3-constitution.md (v1.1.0)
Spec: specs/002-ai-chatbot-mcp/spec.md Section 5.2 (OpenAI Agent)

Implementation: Task T031 (Phase 3: User Story 1)
"""

from typing import List, Dict
from sqlmodel import Session

from .agent_client import AgentClient

# Initialize agent client (singleton)
_agent_client: AgentClient = None


def get_agent_client() -> AgentClient:
    """
    Get or create AgentClient singleton.

    Returns:
        AgentClient instance
    """
    global _agent_client
    if _agent_client is None:
        _agent_client = AgentClient()
    return _agent_client


def call_openai_agent(
    session: Session, user_id: str, conversation_history: List[Dict[str, str]], user_message: str
) -> str:
    """
    Call OpenAI Agent with conversation context.

    This function initializes the AgentClient and runs the agent
    with the user's message and conversation history. The agent
    decides which MCP tools to call and returns a natural language response.

    Args:
        session: Database session for MCP tool execution
        user_id: User identifier (for MCP tool user isolation)
        conversation_history: Previous messages [{"role": "user|assistant", "content": str}]
        user_message: Current user message

    Returns:
        Assistant's response message

    Raises:
        Exception: If OpenAI API fails or tool execution fails

    Example:
        >>> response = call_openai_agent(
        ...     session=db_session,
        ...     user_id="user_123",
        ...     conversation_history=[],
        ...     user_message="Add a task to buy groceries"
        ... )
        >>> print(response)
        "I've created a task to buy groceries for you."
    """
    agent_client = get_agent_client()

    return agent_client.run(
        session=session,
        user_id=user_id,
        conversation_history=conversation_history,
        user_message=user_message,
    )
