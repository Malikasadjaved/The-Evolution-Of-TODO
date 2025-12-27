"""
Unit tests for ConversationManager utility.

Tests for:
- load_conversation_history (T016)
- Context compression when exceeding MAX_CONTEXT_TOKENS
- Keeping last 10 messages + summarizing older ones

Constitution: .specify/memory/phase-3-constitution.md (v1.1.0)
Section XV: Conversation History Management
"""

from datetime import datetime
from sqlmodel import Session

from src.api.models import User, Conversation, Message, MessageRole
from mcp.utils.conversation_manager import ConversationManager


# ============================================================================
# ConversationManager Tests (T016)
# ============================================================================


def test_load_conversation_under_token_limit(test_db_session: Session, test_user: User):
    """
    Test ConversationManager loads all messages when under token limit.

    Validates:
    - All messages returned when total tokens < MAX_CONTEXT_TOKENS
    - Messages ordered by created_at ASC
    - No compression applied

    Constitution: Section XV - Load full history when under limit
    """
    # Arrange: Create conversation with 5 short messages (well under 8000 tokens)
    conversation = Conversation(
        user_id=test_user.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(conversation)
    test_db_session.commit()
    test_db_session.refresh(conversation)

    messages_data = [
        {"role": MessageRole.USER, "content": "Hello"},
        {"role": MessageRole.ASSISTANT, "content": "Hi! How can I help?"},
        {"role": MessageRole.USER, "content": "Add a task"},
        {"role": MessageRole.ASSISTANT, "content": "Sure, what task?"},
        {"role": MessageRole.USER, "content": "Buy groceries"},
    ]

    for msg_data in messages_data:
        msg = Message(
            conversation_id=conversation.id,
            user_id=test_user.id,
            role=msg_data["role"],
            content=msg_data["content"],
            created_at=datetime.utcnow(),
        )
        test_db_session.add(msg)
    test_db_session.commit()

    # Act
    manager = ConversationManager(test_db_session)
    history = manager.load_conversation_history(conversation.id)

    # Assert
    assert len(history) == 5
    assert history[0]["role"] == "user"
    assert history[0]["content"] == "Hello"
    assert history[-1]["role"] == "user"
    assert history[-1]["content"] == "Buy groceries"


def test_load_conversation_over_token_limit_keeps_last_10(
    test_db_session: Session, test_user: User
):
    """
    Test ConversationManager keeps last 10 messages when over token limit.

    Validates:
    - When total tokens > MAX_CONTEXT_TOKENS, keep last 10 messages
    - Older messages are summarized (not included in full)
    - Last 10 messages preserved verbatim

    Constitution: Section XV - Keep last 10 messages, compress older
    """
    # Arrange: Create conversation with 20 messages
    # Simulate each message ~600 tokens (20 * 600 = 12,000 tokens > 8,000 limit)
    conversation = Conversation(
        user_id=test_user.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(conversation)
    test_db_session.commit()
    test_db_session.refresh(conversation)

    # Create 20 messages with long content (simulate high token count)
    for i in range(20):
        role = MessageRole.USER if i % 2 == 0 else MessageRole.ASSISTANT
        # Simulate ~600 tokens per message (rough estimate: 1 token ≈ 4 chars)
        content = f"Message {i}: " + ("word " * 500)  # ~2400 chars ≈ 600 tokens
        msg = Message(
            conversation_id=conversation.id,
            user_id=test_user.id,
            role=role,
            content=content,
            created_at=datetime.utcnow(),
        )
        test_db_session.add(msg)
    test_db_session.commit()

    # Act
    manager = ConversationManager(test_db_session)
    history = manager.load_conversation_history(conversation.id)

    # Assert: Should have summary message + last 10 messages = 11 total
    assert len(history) == 11
    assert history[0]["role"] == "system"
    assert "Earlier conversation summary" in history[0]["content"]
    assert history[1]["content"].startswith("Message 10:")
    assert history[-1]["content"].startswith("Message 19:")


def test_load_conversation_exactly_10_messages(test_db_session: Session, test_user: User):
    """
    Test ConversationManager with exactly 10 messages.

    Validates:
    - No compression when message count <= 10
    - All 10 messages returned as-is

    Constitution: Section XV - Compression threshold
    """
    # Arrange
    conversation = Conversation(
        user_id=test_user.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(conversation)
    test_db_session.commit()
    test_db_session.refresh(conversation)

    for i in range(10):
        role = MessageRole.USER if i % 2 == 0 else MessageRole.ASSISTANT
        msg = Message(
            conversation_id=conversation.id,
            user_id=test_user.id,
            role=role,
            content=f"Message {i}",
            created_at=datetime.utcnow(),
        )
        test_db_session.add(msg)
    test_db_session.commit()

    # Act
    manager = ConversationManager(test_db_session)
    history = manager.load_conversation_history(conversation.id)

    # Assert: No compression, all 10 messages returned
    assert len(history) == 10
    assert history[0]["role"] in ["user", "assistant"]
    assert "summary" not in history[0]["content"].lower()


def test_load_conversation_summarize_older_messages(test_db_session: Session, test_user: User):
    """
    Test ConversationManager summarizes older messages.

    Validates:
    - Messages exceeding limit get summarized
    - Summary includes message count
    - Last 10 messages preserved

    Constitution: Section XV - Summarization strategy
    """
    # Arrange: 15 messages total with long content to exceed token limit
    conversation = Conversation(
        user_id=test_user.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(conversation)
    test_db_session.commit()
    test_db_session.refresh(conversation)

    for i in range(15):
        role = MessageRole.USER if i % 2 == 0 else MessageRole.ASSISTANT
        # Long content to ensure we exceed token limit
        content = f"Message {i}: " + (
            "task discussion content " * 600
        )  # ~14k chars ≈ 3500 tokens per message
        msg = Message(
            conversation_id=conversation.id,
            user_id=test_user.id,
            role=role,
            content=content,
            created_at=datetime.utcnow(),
        )
        test_db_session.add(msg)
    test_db_session.commit()

    # Act
    manager = ConversationManager(test_db_session)
    history = manager.load_conversation_history(conversation.id)

    # Assert
    assert len(history) == 11  # 1 summary + 10 recent messages
    assert history[0]["role"] == "system"
    assert "5 messages" in history[0]["content"]  # First 5 messages summarized
    assert history[1]["content"].startswith("Message 5:")  # Last 10 start at index 5
