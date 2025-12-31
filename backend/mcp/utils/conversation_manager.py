"""
ConversationManager - Handles conversation history loading and compression.

Constitution: .specify/memory/phase-3-constitution.md (v1.1.0)
Section XV: Conversation History Management

Key Requirements:
- Stateless: Fetch from database on every request
- MAX_CONTEXT_TOKENS = 8000 (OpenAI GPT-4 limit consideration)
- Keep last 10 messages verbatim
- Summarize older messages when exceeding token limit
- Order messages by created_at ASC for proper conversation flow
"""

from typing import List, Dict, Any
from sqlmodel import Session, select
from src.api.models import Message
import tiktoken


# Constitution Section XV: Maximum context tokens
MAX_CONTEXT_TOKENS = 8000

# Configuration
LAST_N_MESSAGES_TO_KEEP = 10  # Keep last 10 messages verbatim
APPROX_TOKENS_PER_CHAR = 0.25  # Rough estimate: 4 chars ≈ 1 token


class ConversationManager:
    """
    Manages conversation history loading with automatic compression.

    Stateless Design:
    - No in-memory caching
    - Fetches from database on every call
    - Server can restart without data loss

    Compression Strategy:
    - If total messages <= 10: Return all
    - If total messages > 10 and tokens > MAX_CONTEXT_TOKENS:
      1. Keep last 10 messages verbatim
      2. Summarize older messages into single system message
    """

    def __init__(self, session: Session):
        """
        Initialize ConversationManager.

        Args:
            session: SQLModel database session (stateless, injected)
        """
        self.session = session
        self.encoding = tiktoken.get_encoding("cl100k_base")  # GPT-4 encoding

    def load_conversation_history(self, conversation_id: int) -> List[Dict[str, Any]]:
        """
        Load conversation history with automatic compression if needed.

        Constitution Compliance:
        - Stateless: Queries database on every call
        - Respects MAX_CONTEXT_TOKENS limit
        - Preserves last 10 messages for context continuity

        Args:
            conversation_id: ID of conversation to load

        Returns:
            List of message dictionaries in format:
            [
                {"role": "user", "content": "..."},
                {"role": "assistant", "content": "..."},
                ...
            ]
            Ordered by created_at ASC (oldest first)
        """
        # Fetch all messages for this conversation (stateless query)
        statement = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at)  # ASC order for proper flow
        )
        messages = self.session.exec(statement).all()

        # Convert to OpenAI format
        history = [{"role": msg.role.value, "content": msg.content} for msg in messages]

        # Check if compression needed
        total_messages = len(history)

        if total_messages <= LAST_N_MESSAGES_TO_KEEP:
            # No compression needed
            return history

        # Estimate total tokens
        total_tokens = self._estimate_tokens(history)

        if total_tokens <= MAX_CONTEXT_TOKENS:
            # Under limit, return all messages
            return history

        # Compression needed: Keep last 10, summarize older
        return self._compress_history(history)

    def _compress_history(self, history: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Compress conversation history by summarizing older messages.

        Strategy:
        - Keep last LAST_N_MESSAGES_TO_KEEP messages verbatim
        - Create summary of older messages
        - Insert summary as system message at beginning

        Args:
            history: Full conversation history

        Returns:
            Compressed history with summary + last N messages
        """
        if len(history) <= LAST_N_MESSAGES_TO_KEEP:
            return history

        # Split into older and recent
        older_messages = history[:-LAST_N_MESSAGES_TO_KEEP]
        recent_messages = history[-LAST_N_MESSAGES_TO_KEEP:]

        # Create summary of older messages
        summary_content = self._create_summary(older_messages)
        summary_message = {"role": "system", "content": summary_content}

        # Return summary + recent messages
        return [summary_message] + recent_messages

    def _create_summary(self, messages: List[Dict[str, Any]]) -> str:
        """
        Create a summary of older messages.

        Simple summarization strategy:
        - Count messages
        - Extract key information (task operations, user intent)

        Args:
            messages: List of older messages to summarize

        Returns:
            Summary text
        """
        message_count = len(messages)

        # Simple summary (can be enhanced with AI summarization later)
        summary = f"Earlier conversation summary ({message_count} messages): "
        summary += "The user and assistant discussed task management. "

        # Extract task-related keywords
        task_keywords = ["task", "add", "create", "complete", "delete", "update", "list"]
        mentioned_keywords = set()

        for msg in messages:
            content_lower = msg["content"].lower()
            for keyword in task_keywords:
                if keyword in content_lower:
                    mentioned_keywords.add(keyword)

        if mentioned_keywords:
            summary += f"Topics included: {', '.join(sorted(mentioned_keywords))}."

        return summary

    def _estimate_tokens(self, history: List[Dict[str, Any]]) -> int:
        """
        Estimate total tokens in conversation history.

        Uses tiktoken for accurate token counting (GPT-4 encoding).

        Args:
            history: List of message dictionaries

        Returns:
            Estimated total tokens
        """
        total_tokens = 0

        for msg in history:
            # Count tokens for role and content
            role_tokens = len(self.encoding.encode(msg["role"]))
            content_tokens = len(self.encoding.encode(msg["content"]))
            total_tokens += role_tokens + content_tokens

            # Add overhead tokens (OpenAI message format overhead)
            total_tokens += 4  # Approximate overhead per message

        return total_tokens
