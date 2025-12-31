"""
Unit tests for Phase 3 database models.

Tests for:
- Conversation model (T011)
- Message model (T012)

Constitution: .specify/memory/phase-3-constitution.md (v1.1.0)
Test Coverage Target: 100% for critical models
"""

from datetime import datetime
from sqlmodel import Session, select

from src.api.models import User, Conversation, Message, MessageRole


# ============================================================================
# Conversation Model Tests (T011)
# ============================================================================


def test_conversation_create(test_db_session: Session, test_user: User):
    """
    Test Conversation model creation with all required fields.

    Validates:
    - Conversation can be created with user_id
    - Timestamps are auto-generated
    - Record persists to database

    Constitution: Section III - Database Schema (conversations table)
    """
    # Arrange & Act
    conversation = Conversation(
        user_id=test_user.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(conversation)
    test_db_session.commit()
    test_db_session.refresh(conversation)

    # Assert
    assert conversation.id is not None
    assert conversation.user_id == test_user.id
    assert conversation.created_at is not None
    assert conversation.updated_at is not None
    assert isinstance(conversation.created_at, datetime)
    assert isinstance(conversation.updated_at, datetime)


def test_conversation_cascade_delete(test_db_session: Session, test_user: User):
    """
    Test cascade delete behavior when conversation is deleted.

    Validates:
    - Messages are deleted when parent conversation is deleted
    - No orphaned messages remain

    Constitution: Section III - Cascade delete on conversations
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

    # Add messages to conversation
    message1 = Message(
        conversation_id=conversation.id,
        user_id=test_user.id,
        role=MessageRole.USER,
        content="Test message 1",
        created_at=datetime.utcnow(),
    )
    message2 = Message(
        conversation_id=conversation.id,
        user_id=test_user.id,
        role=MessageRole.ASSISTANT,
        content="Test response 1",
        created_at=datetime.utcnow(),
    )
    test_db_session.add(message1)
    test_db_session.add(message2)
    test_db_session.commit()

    # Act: Delete conversation
    test_db_session.delete(conversation)
    test_db_session.commit()

    # Assert: Messages should be cascade deleted
    messages = test_db_session.exec(
        select(Message).where(Message.conversation_id == conversation.id)
    ).all()
    assert len(messages) == 0


def test_conversation_user_id_index(test_db_session: Session, test_user: User):
    """
    Test that user_id index exists for performance optimization.

    Validates:
    - Conversations can be efficiently queried by user_id
    - Multiple conversations per user are supported

    Constitution: Section III - Index on user_id for performance
    """
    # Arrange: Create multiple conversations for same user
    conversation1 = Conversation(
        user_id=test_user.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    conversation2 = Conversation(
        user_id=test_user.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(conversation1)
    test_db_session.add(conversation2)
    test_db_session.commit()

    # Act: Query by user_id (should use index)
    conversations = test_db_session.exec(
        select(Conversation).where(Conversation.user_id == test_user.id)
    ).all()

    # Assert
    assert len(conversations) == 2
    assert all(conv.user_id == test_user.id for conv in conversations)


# ============================================================================
# Message Model Tests (T012)
# ============================================================================


def test_message_user_role(test_db_session: Session, test_user: User):
    """
    Test Message model with role='user'.

    Validates:
    - User messages can be created and stored
    - All required fields are present

    Constitution: Section III - Messages table (role: user, assistant)
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

    # Act
    message = Message(
        conversation_id=conversation.id,
        user_id=test_user.id,
        role=MessageRole.USER,
        content="Hello, I want to add a task",
        created_at=datetime.utcnow(),
    )
    test_db_session.add(message)
    test_db_session.commit()
    test_db_session.refresh(message)

    # Assert
    assert message.id is not None
    assert message.conversation_id == conversation.id
    assert message.user_id == test_user.id
    assert message.role == MessageRole.USER
    assert message.content == "Hello, I want to add a task"
    assert message.created_at is not None


def test_message_assistant_role(test_db_session: Session, test_user: User):
    """
    Test Message model with role='assistant'.

    Validates:
    - Assistant responses can be stored
    - Role field accepts 'assistant' value

    Constitution: Section III - Messages table (role: user, assistant)
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

    # Act
    message = Message(
        conversation_id=conversation.id,
        user_id=test_user.id,
        role=MessageRole.ASSISTANT,
        content="I've added the task for you.",
        created_at=datetime.utcnow(),
    )
    test_db_session.add(message)
    test_db_session.commit()
    test_db_session.refresh(message)

    # Assert
    assert message.id is not None
    assert message.role == MessageRole.ASSISTANT
    assert message.content == "I've added the task for you."


def test_message_role_coercion(test_db_session: Session, test_user: User):
    """
    Test Message model accepts both enum and string values for role.

    Validates:
    - MessageRole enum can be passed directly
    - String values 'user' and 'assistant' are coerced to enum

    Constitution: Section III - Role enum (user, assistant)
    Note: SQLModel/Pydantic string enums accept both enum values and string literals
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

    # Act: Create message with string value (coerced to enum)
    message = Message(
        conversation_id=conversation.id,
        user_id=test_user.id,
        role="user",  # String value - will be coerced to MessageRole.USER
        content="Test content",
        created_at=datetime.utcnow(),
    )
    test_db_session.add(message)
    test_db_session.commit()
    test_db_session.refresh(message)

    # Assert: String was coerced to enum
    assert message.role == MessageRole.USER
    assert message.content == "Test content"
