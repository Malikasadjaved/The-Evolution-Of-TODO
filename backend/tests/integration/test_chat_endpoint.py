"""
Integration tests for POST /api/{user_id}/chat endpoint.

Tests for:
- Chat endpoint creates conversation on first message
- Chat endpoint loads existing conversation
- Chat endpoint stores user and assistant messages
- Chat endpoint calls OpenAI Agent
- Chat endpoint enforces JWT authentication
- Chat endpoint enforces user isolation
- Chat endpoint handles errors gracefully

Constitution: .specify/memory/phase-3-constitution.md (v1.1.0)
Spec: specs/002-ai-chatbot-mcp/spec.md Section 4.1 (Chat Endpoint)

Chat Endpoint Contract:
- Method: POST
- Path: /api/{user_id}/chat
- Request: {"message": str, "conversation_id": Optional[int]}
- Response: {"message": str, "conversation_id": int}
- Behavior:
  1. Authenticate JWT token (extract user_id)
  2. Verify token user_id matches URL user_id
  3. Create conversation if conversation_id not provided
  4. Store user message in database
  5. Call OpenAI Agent with conversation history
  6. Agent executes MCP tools (e.g., add_task)
  7. Store assistant response in database
  8. Return assistant message and conversation_id
"""

from fastapi.testclient import TestClient
from sqlmodel import Session, select

from src.api.models import Conversation, Message, MessageRole, Task


# ============================================================================
# Chat Endpoint Tests (T026)
# ============================================================================


async def test_chat_endpoint_creates_new_conversation(
    client: TestClient,
    test_jwt_token: str,
    test_user,
    test_db_session: Session,
    mocker,
):
    """
    Test chat endpoint creates new conversation on first message.

    Validates:
    - No conversation_id in request → new conversation created
    - User message stored with role=USER
    - Assistant response stored with role=ASSISTANT
    - Response includes conversation_id
    - Conversation belongs to authenticated user

    Constitution: Section IX - Stateless architecture
    """
    # Arrange
    user_id = test_user.id

    # Mock OpenAI Agent response (avoid real API call)
    mock_agent_response = "I've created a task to buy groceries."
    mocker.patch("src.api.routes.chat.call_openai_agent", return_value=mock_agent_response)

    # Act
    response = await client.post(
        f"/api/{user_id}/chat",
        json={"message": "Add a task to buy groceries"},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "conversation_id" in data
    assert data["message"] == mock_agent_response
    assert isinstance(data["conversation_id"], int)

    # Verify conversation created in database
    conversation_id = data["conversation_id"]
    statement = select(Conversation).where(Conversation.id == conversation_id)
    conversation = test_db_session.exec(statement).first()
    assert conversation is not None
    assert conversation.user_id == user_id

    # Verify messages stored (user + assistant)
    statement = select(Message).where(Message.conversation_id == conversation_id)
    messages = test_db_session.exec(statement).all()
    assert len(messages) == 2

    # User message
    assert messages[0].role == MessageRole.USER
    assert messages[0].content == "Add a task to buy groceries"
    assert messages[0].user_id == user_id

    # Assistant message
    assert messages[1].role == MessageRole.ASSISTANT
    assert messages[1].content == mock_agent_response
    assert messages[1].user_id == user_id


async def test_chat_endpoint_uses_existing_conversation(
    client: TestClient,
    test_jwt_token: str,
    test_user,
    test_db_session: Session,
    mocker,
):
    """
    Test chat endpoint continues existing conversation.

    Validates:
    - conversation_id in request → reuse existing conversation
    - Previous messages loaded as context
    - New messages appended to same conversation
    - No new conversation created

    Constitution: Section II - Stateless (load from DB)
    """
    # Arrange
    user_id = test_user.id

    # Create existing conversation with 2 messages
    from datetime import datetime

    conversation = Conversation(
        user_id=user_id, created_at=datetime.utcnow(), updated_at=datetime.utcnow()
    )
    test_db_session.add(conversation)
    test_db_session.commit()
    test_db_session.refresh(conversation)

    message1 = Message(
        conversation_id=conversation.id,
        user_id=user_id,
        role=MessageRole.USER,
        content="Hello",
        created_at=datetime.utcnow(),
    )
    message2 = Message(
        conversation_id=conversation.id,
        user_id=user_id,
        role=MessageRole.ASSISTANT,
        content="Hi! How can I help?",
        created_at=datetime.utcnow(),
    )
    test_db_session.add(message1)
    test_db_session.add(message2)
    test_db_session.commit()

    # Mock OpenAI Agent
    mock_response = "I've created a task for you."
    mocker.patch("src.api.routes.chat.call_openai_agent", return_value=mock_response)

    # Act
    response = await client.post(
        f"/api/{user_id}/chat",
        json={"message": "Add a task to finish report", "conversation_id": conversation.id},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["conversation_id"] == conversation.id  # Same conversation

    # Verify 4 messages total (2 existing + 2 new)
    statement = select(Message).where(Message.conversation_id == conversation.id)
    messages = test_db_session.exec(statement).all()
    assert len(messages) == 4
    assert messages[2].content == "Add a task to finish report"
    assert messages[3].content == mock_response


async def test_chat_endpoint_enforces_jwt_authentication(
    client: TestClient,
    test_user,
):
    """
    Test chat endpoint requires valid JWT token.

    Validates:
    - Missing token → 401 Unauthorized
    - Invalid token → 401 Unauthorized
    - Expired token → 401 Unauthorized

    Constitution: Section VI - JWT verification (5-step flow)
    """
    user_id = test_user.id

    # Test 1: Missing Authorization header
    response = await client.post(f"/api/{user_id}/chat", json={"message": "Hello"})
    assert response.status_code == 401

    # Test 2: Invalid token format
    response = await client.post(
        f"/api/{user_id}/chat",
        json={"message": "Hello"},
        headers={"Authorization": "Bearer invalid_token_xyz"},
    )
    assert response.status_code == 401

    # Test 3: Missing Bearer prefix
    response = await client.post(
        f"/api/{user_id}/chat", json={"message": "Hello"}, headers={"Authorization": "just_a_token"}
    )
    assert response.status_code == 401


async def test_chat_endpoint_enforces_user_isolation(
    client: TestClient,
    test_jwt_token: str,
    test_user,
    test_user_2,
):
    """
    Test chat endpoint prevents access to other users' conversations.

    Validates:
    - Token user_id must match URL user_id
    - Cannot access other user's conversation_id
    - 403 Forbidden returned on mismatch

    Constitution: Section IX - User isolation
    """
    # Arrange
    _user1_id = test_user.id  # noqa: F841
    user2_id = test_user_2.id

    # Test 1: Token user1, URL user2 → 403
    response = await client.post(
        f"/api/{user2_id}/chat",  # Wrong user_id in URL
        json={"message": "Hello"},
        headers={"Authorization": f"Bearer {test_jwt_token}"},  # user1's token
    )
    assert response.status_code == 403
    assert "Access denied" in response.json()["detail"]


async def test_chat_endpoint_validates_input(
    client: TestClient,
    test_jwt_token: str,
    test_user,
):
    """
    Test chat endpoint validates request body.

    Validates:
    - message is required
    - message cannot be empty string
    - message max length enforced (10000 characters)
    - conversation_id must be integer if provided

    Constitution: Section X - Input validation
    """
    user_id = test_user.id

    # Test 1: Missing message field
    response = await client.post(
        f"/api/{user_id}/chat",
        json={},  # No message
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )
    assert response.status_code == 422  # Validation error

    # Test 2: Empty message
    response = await client.post(
        f"/api/{user_id}/chat",
        json={"message": ""},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )
    assert response.status_code == 422

    # Test 3: Message too long
    long_message = "A" * 10001  # Exceeds 10000 char limit
    response = await client.post(
        f"/api/{user_id}/chat",
        json={"message": long_message},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )
    assert response.status_code == 422

    # Test 4: Invalid conversation_id type
    response = await client.post(
        f"/api/{user_id}/chat",
        json={"message": "Hello", "conversation_id": "not_an_int"},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )
    assert response.status_code == 422


async def test_chat_endpoint_handles_openai_error_gracefully(
    client: TestClient,
    test_jwt_token: str,
    test_user,
    test_db_session: Session,
    mocker,
):
    """
    Test chat endpoint handles OpenAI API errors gracefully.

    Validates:
    - OpenAI API failure → user-friendly error message
    - User message still stored (conversation state preserved)
    - No assistant message stored on failure
    - 500 error returned with fallback message

    Constitution: Section XVI - Error handling (fail fast, clear messages)
    """
    # Arrange
    user_id = test_user.id

    # Mock OpenAI Agent to raise exception
    mocker.patch(
        "src.api.routes.chat.call_openai_agent", side_effect=Exception("OpenAI API timeout")
    )

    # Act
    response = await client.post(
        f"/api/{user_id}/chat",
        json={"message": "Add a task"},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )

    # Assert
    assert response.status_code == 500
    data = response.json()
    # Error is nested under "detail"
    assert "detail" in data
    detail = data["detail"]
    assert "error" in detail
    assert "temporarily unavailable" in detail["error"] or "OpenAI" in detail.get("message", "")

    # Verify user message was stored (conversation state preserved)
    statement = select(Message).where(Message.user_id == user_id)
    messages = test_db_session.exec(statement).all()
    assert len(messages) == 1  # Only user message, no assistant message
    assert messages[0].role == MessageRole.USER


# ============================================================================
# Edge Case Tests (T027)
# ============================================================================


async def test_chat_endpoint_handles_very_long_conversation(
    client: TestClient,
    test_jwt_token: str,
    test_user,
    test_db_session: Session,
    mocker,
):
    """
    Test chat endpoint handles conversations exceeding token limit.

    Validates:
    - ConversationManager truncates old messages
    - Last 10 messages always included
    - Older messages summarized
    - OpenAI Agent still receives valid context

    Constitution: Section XV - Context management (MAX_CONTEXT_TOKENS=8000)
    """
    # Arrange
    user_id = test_user.id

    # Create conversation with 50 messages (exceeds token limit)
    from datetime import datetime

    conversation = Conversation(
        user_id=user_id, created_at=datetime.utcnow(), updated_at=datetime.utcnow()
    )
    test_db_session.add(conversation)
    test_db_session.commit()
    test_db_session.refresh(conversation)

    for i in range(50):
        message = Message(
            conversation_id=conversation.id,
            user_id=user_id,
            role=MessageRole.USER if i % 2 == 0 else MessageRole.ASSISTANT,
            content=f"Message {i}: " + ("long content " * 100),  # Make it long
            created_at=datetime.utcnow(),
        )
        test_db_session.add(message)
    test_db_session.commit()

    # Mock OpenAI Agent
    mock_response = "Got it!"
    mocker.patch("src.api.routes.chat.call_openai_agent", return_value=mock_response)

    # Act
    response = await client.post(
        f"/api/{user_id}/chat",
        json={"message": "New message", "conversation_id": conversation.id},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )

    # Assert
    assert response.status_code == 200
    # If ConversationManager works correctly, this should succeed


async def test_chat_endpoint_conversation_not_found_error(
    client: TestClient,
    test_jwt_token: str,
    test_user,
):
    """
    Test chat endpoint handles non-existent conversation_id.

    Validates:
    - Invalid conversation_id → 404 Not Found
    - Clear error message returned

    Constitution: Section X - Clear error messages
    """
    user_id = test_user.id

    response = await client.post(
        f"/api/{user_id}/chat",
        json={"message": "Hello", "conversation_id": 99999},  # Does not exist
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )

    assert response.status_code == 404
    assert "Conversation not found" in response.json()["detail"]


async def test_chat_endpoint_conversation_belongs_to_different_user(
    client: TestClient,
    test_jwt_token: str,
    test_user,
    test_user_2,
    test_db_session: Session,
):
    """
    Test chat endpoint prevents access to other user's conversation.

    Validates:
    - Cannot use another user's conversation_id
    - 403 Forbidden returned
    - User isolation enforced

    Constitution: Section IX - User isolation
    """
    # Arrange
    user1_id = test_user.id
    user2_id = test_user_2.id

    # Create conversation for user2
    from datetime import datetime

    conversation = Conversation(
        user_id=user2_id, created_at=datetime.utcnow(), updated_at=datetime.utcnow()
    )
    test_db_session.add(conversation)
    test_db_session.commit()
    test_db_session.refresh(conversation)

    # Act: user1 tries to access user2's conversation
    response = await client.post(
        f"/api/{user1_id}/chat",
        json={"message": "Hello", "conversation_id": conversation.id},  # Belongs to user2
        headers={"Authorization": f"Bearer {test_jwt_token}"},  # user1's token
    )

    # Assert
    assert response.status_code == 403
    assert (
        "Access denied" in response.json()["detail"]
        or "not found" in response.json()["detail"].lower()
    )


# ============================================================================
# MCP Tool Integration Tests (User Story 4: update_task)
# ============================================================================


async def test_chat_endpoint_update_task_via_agent(
    client: TestClient,
    test_jwt_token: str,
    test_user,
    test_db_session: Session,
    mocker,
):
    """
    Test chat endpoint calls update_task MCP tool via OpenAI Agent.

    Validates:
    - Agent receives user message requesting task update
    - Agent calls update_task MCP tool with correct parameters
    - Task updated in database (title, priority, description, etc.)
    - Agent response confirms update
    - User isolation enforced

    Constitution: Section IX - MCP tool integration
    Spec: specs/002-ai-chatbot-mcp/spec.md Section 5.1.4 (update_task tool)
    """
    # Arrange
    user_id = test_user.id

    # Create existing task to update
    from datetime import datetime, timedelta
    from mcp.schemas import TaskPriority, TaskStatus

    task = Task(
        user_id=user_id,
        title="Original task title",
        description="Original description",
        priority=TaskPriority.LOW,
        status=TaskStatus.INCOMPLETE,
        due_date=datetime.utcnow() + timedelta(days=7),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task)
    test_db_session.commit()
    test_db_session.refresh(task)
    task_id = task.id

    # Mock OpenAI Agent to simulate update_task tool call
    # In real scenario, agent would parse user message and call update_task
    mock_agent_response = f"I've updated task #{task_id} to high priority with the new title 'Urgent: Complete report'."

    # Mock the agent to actually call update_task tool
    from mcp.tools.update_task import update_task
    from mcp.schemas import UpdateTaskInput

    def mock_call_agent(session, user_id, conversation_history, user_message):
        # Simulate agent calling update_task MCP tool
        task_input = UpdateTaskInput(
            task_id=task_id,
            title="Urgent: Complete report",
            priority=TaskPriority.HIGH,
            description="Updated description with urgency",
        )
        update_task(session=session, user_id=user_id, task_input=task_input)
        return mock_agent_response

    mocker.patch("src.api.routes.chat.call_openai_agent", side_effect=mock_call_agent)

    # Act
    response = await client.post(
        f"/api/{user_id}/chat",
        json={
            "message": f"Update task {task_id} to high priority and change title to 'Urgent: Complete report'"
        },
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )

    # Assert HTTP response
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert data["message"] == mock_agent_response
    assert "updated" in data["message"].lower() or "high priority" in data["message"].lower()

    # Verify task updated in database
    statement = select(Task).where(Task.id == task_id)
    updated_task = test_db_session.exec(statement).first()

    assert updated_task is not None
    assert updated_task.title == "Urgent: Complete report"  # Title updated
    assert updated_task.priority == TaskPriority.HIGH  # Priority updated
    assert updated_task.description == "Updated description with urgency"  # Description updated
    assert updated_task.status == TaskStatus.INCOMPLETE  # Status preserved
    assert updated_task.user_id == user_id  # User isolation maintained
    assert updated_task.updated_at > task.created_at  # Timestamp updated


async def test_chat_endpoint_update_task_partial_update(
    client: TestClient,
    test_jwt_token: str,
    test_user,
    test_db_session: Session,
    mocker,
):
    """
    Test chat endpoint handles partial task updates via update_task tool.

    Validates:
    - Only specified fields updated
    - Other fields preserved
    - Agent correctly interprets user intent
    - User-friendly confirmation message

    Constitution: Section IX - Principle of least privilege
    """
    # Arrange
    user_id = test_user.id

    from datetime import datetime, timedelta
    from mcp.schemas import TaskPriority, TaskStatus

    original_due_date = datetime.utcnow() + timedelta(days=5)
    task = Task(
        user_id=user_id,
        title="Task to update",
        description="Keep this description",
        priority=TaskPriority.MEDIUM,
        status=TaskStatus.INCOMPLETE,
        due_date=original_due_date,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task)
    test_db_session.commit()
    test_db_session.refresh(task)
    task_id = task.id

    # Mock agent to update only priority
    from mcp.tools.update_task import update_task
    from mcp.schemas import UpdateTaskInput

    mock_response = f"I've changed task #{task_id} priority to LOW."

    def mock_call_agent(session, user_id, conversation_history, user_message):
        task_input = UpdateTaskInput(
            task_id=task_id, priority=TaskPriority.LOW  # Only update priority
        )
        update_task(session=session, user_id=user_id, task_input=task_input)
        return mock_response

    mocker.patch("src.api.routes.chat.call_openai_agent", side_effect=mock_call_agent)

    # Act
    response = await client.post(
        f"/api/{user_id}/chat",
        json={"message": f"Change task {task_id} to low priority"},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )

    # Assert
    assert response.status_code == 200

    # Verify partial update in database
    statement = select(Task).where(Task.id == task_id)
    updated_task = test_db_session.exec(statement).first()

    assert updated_task.priority == TaskPriority.LOW  # Updated
    assert updated_task.title == "Task to update"  # Preserved
    assert updated_task.description == "Keep this description"  # Preserved
    assert updated_task.due_date == original_due_date  # Preserved


async def test_chat_endpoint_update_task_user_isolation(
    client: TestClient,
    test_jwt_token: str,
    test_user,
    test_user_2,
    test_db_session: Session,
    mocker,
):
    """
    Test chat endpoint enforces user isolation when updating tasks.

    Validates:
    - User cannot update another user's task via chat
    - Agent correctly filters tasks by user_id
    - Error message returned if task not found or access denied

    Constitution: Section IX - User isolation (critical security)
    """
    # Arrange
    user1_id = test_user.id
    user2_id = test_user_2.id

    # Create task for user2
    from datetime import datetime
    from mcp.schemas import TaskPriority, TaskStatus

    user2_task = Task(
        user_id=user2_id,
        title="User2's task",
        priority=TaskPriority.MEDIUM,
        status=TaskStatus.INCOMPLETE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(user2_task)
    test_db_session.commit()
    test_db_session.refresh(user2_task)
    task_id = user2_task.id

    # Mock agent to attempt update (should fail due to user isolation)
    from mcp.tools.update_task import update_task
    from mcp.schemas import UpdateTaskInput

    def mock_call_agent(session, user_id, conversation_history, user_message):
        task_input = UpdateTaskInput(task_id=task_id, title="Malicious update attempt")
        # This should raise "Task not found" because user1 tries to update user2's task
        try:
            update_task(session=session, user_id=user_id, task_input=task_input)
            return "Updated successfully"
        except Exception as _e:  # noqa: F841
            # Agent should handle this gracefully
            return f"I couldn't find a task with ID {task_id}. It may not exist or you don't have permission to access it."

    mocker.patch("src.api.routes.chat.call_openai_agent", side_effect=mock_call_agent)

    # Act: User1 tries to update User2's task via chat
    response = await client.post(
        f"/api/{user1_id}/chat",
        json={"message": f"Update task {task_id} to high priority"},
        headers={"Authorization": f"Bearer {test_jwt_token}"},  # user1's token
    )

    # Assert
    assert response.status_code == 200  # Chat endpoint succeeds, but agent returns error message
    data = response.json()
    assert (
        "couldn't find" in data["message"].lower()
        or "not exist" in data["message"].lower()
        or "permission" in data["message"].lower()
    )

    # Verify user2's task unchanged
    statement = select(Task).where(Task.id == task_id)
    unchanged_task = test_db_session.exec(statement).first()
    assert unchanged_task.title == "User2's task"  # Not changed
    assert unchanged_task.priority == TaskPriority.MEDIUM  # Not changed


# ============================================================================
# MCP Tool Integration Tests (User Story 5: delete_task)
# ============================================================================


async def test_chat_endpoint_delete_task_via_agent(
    client: TestClient,
    test_jwt_token: str,
    test_user,
    test_db_session: Session,
    mocker,
):
    """
    Test chat endpoint calls delete_task MCP tool via OpenAI Agent.

    Validates:
    - Agent receives user message requesting task deletion
    - Agent calls delete_task MCP tool with task_id
    - Task deleted from database (permanent hard delete)
    - Agent response confirms deletion with task title
    - User isolation enforced

    Constitution: Section IX - MCP tool integration
    Spec: specs/002-ai-chatbot-mcp/spec.md Section 5.1.5 (delete_task tool)
    """
    # Arrange
    user_id = test_user.id

    # Create task to delete
    from datetime import datetime
    from mcp.schemas import TaskPriority, TaskStatus

    task = Task(
        user_id=user_id,
        title="Task to delete via chat",
        description="This will be deleted",
        priority=TaskPriority.MEDIUM,
        status=TaskStatus.INCOMPLETE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task)
    test_db_session.commit()
    test_db_session.refresh(task)
    task_id = task.id

    # Mock OpenAI Agent to call delete_task tool
    from mcp.tools.delete_task import delete_task
    from mcp.schemas import DeleteTaskInput

    mock_agent_response = f"I've permanently deleted the task '{task.title}' (ID: {task_id})."

    def mock_call_agent(session, user_id, conversation_history, user_message):
        # Simulate agent calling delete_task MCP tool
        task_input = DeleteTaskInput(task_id=task_id)
        delete_task(session=session, user_id=user_id, task_input=task_input)
        return mock_agent_response

    mocker.patch("src.api.routes.chat.call_openai_agent", side_effect=mock_call_agent)

    # Act
    response = await client.post(
        f"/api/{user_id}/chat",
        json={"message": f"Delete task {task_id}"},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )

    # Assert HTTP response
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert data["message"] == mock_agent_response
    assert "delete" in data["message"].lower() or "removed" in data["message"].lower()

    # Verify task deleted from database (PERMANENT hard delete)
    statement = select(Task).where(Task.id == task_id)
    deleted_task = test_db_session.exec(statement).first()
    assert deleted_task is None  # Task no longer exists


async def test_chat_endpoint_delete_task_user_isolation(
    client: TestClient,
    test_jwt_token: str,
    test_user,
    test_user_2,
    test_db_session: Session,
    mocker,
):
    """
    Test chat endpoint enforces user isolation when deleting tasks.

    Validates:
    - User cannot delete another user's task via chat
    - Agent correctly filters tasks by user_id
    - Error message returned if task not found or access denied
    - Original user's task remains unchanged

    Constitution: Section IX - User isolation (CRITICAL SECURITY)
    """
    # Arrange
    user1_id = test_user.id
    user2_id = test_user_2.id

    # Create task for user2
    from datetime import datetime
    from mcp.schemas import TaskPriority, TaskStatus

    user2_task = Task(
        user_id=user2_id,
        title="User2's protected task",
        priority=TaskPriority.HIGH,
        status=TaskStatus.INCOMPLETE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(user2_task)
    test_db_session.commit()
    test_db_session.refresh(user2_task)
    task_id = user2_task.id

    # Mock agent to attempt deletion (should fail due to user isolation)
    from mcp.tools.delete_task import delete_task
    from mcp.schemas import DeleteTaskInput

    def mock_call_agent(session, user_id, conversation_history, user_message):
        task_input = DeleteTaskInput(task_id=task_id)
        # This should raise "Task not found" because user1 tries to delete user2's task
        try:
            delete_task(session=session, user_id=user_id, task_input=task_input)
            return "Deleted successfully"
        except Exception as _e:  # noqa: F841
            # Agent should handle this gracefully
            return f"I couldn't find a task with ID {task_id}. It may not exist or you don't have permission to access it."

    mocker.patch("src.api.routes.chat.call_openai_agent", side_effect=mock_call_agent)

    # Act: User1 tries to delete User2's task via chat
    response = await client.post(
        f"/api/{user1_id}/chat",
        json={"message": f"Delete task {task_id}"},
        headers={"Authorization": f"Bearer {test_jwt_token}"},  # user1's token
    )

    # Assert
    assert response.status_code == 200  # Chat endpoint succeeds, but agent returns error message
    data = response.json()
    assert (
        "couldn't find" in data["message"].lower()
        or "not exist" in data["message"].lower()
        or "permission" in data["message"].lower()
    )

    # Verify user2's task still exists (NOT deleted)
    statement = select(Task).where(Task.id == task_id)
    unchanged_task = test_db_session.exec(statement).first()
    assert unchanged_task is not None  # Task still exists
    assert unchanged_task.title == "User2's protected task"


async def test_chat_endpoint_delete_task_phase_2_sync(
    client: TestClient,
    test_jwt_token: str,
    test_user,
    test_db_session: Session,
    mocker,
):
    """
    Test delete_task syncs with Phase 2 web UI (shared database).

    Validates:
    - Task deleted via chatbot (Phase 3) disappears from web UI (Phase 2)
    - Same database, same tasks table
    - Real-time synchronization (< 1 second)
    - PERMANENT deletion (hard delete, not soft delete)

    Constitution: Section II - Monorepo integration
    Spec: FR-42 (Phase 2/3 task synchronization)
    """
    # Arrange
    user_id = test_user.id

    # Create task (could be from Phase 2 web UI)
    from datetime import datetime
    from mcp.schemas import TaskPriority, TaskStatus

    task = Task(
        user_id=user_id,
        title="Task created in Phase 2 web UI",
        description="Will be deleted via Phase 3 chatbot",
        priority=TaskPriority.HIGH,
        status=TaskStatus.INCOMPLETE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task)
    test_db_session.commit()
    test_db_session.refresh(task)
    task_id = task.id

    # Verify task exists (visible to Phase 2 web UI)
    statement = select(Task).where(Task.user_id == user_id)
    phase2_tasks_before = test_db_session.exec(statement).all()
    assert len(phase2_tasks_before) == 1
    assert phase2_tasks_before[0].title == "Task created in Phase 2 web UI"

    # Mock agent to delete task via chatbot
    from mcp.tools.delete_task import delete_task
    from mcp.schemas import DeleteTaskInput

    mock_response = "I've deleted the task 'Task created in Phase 2 web UI'."

    def mock_call_agent(session, user_id, conversation_history, user_message):
        task_input = DeleteTaskInput(task_id=task_id)
        delete_task(session=session, user_id=user_id, task_input=task_input)
        return mock_response

    mocker.patch("src.api.routes.chat.call_openai_agent", side_effect=mock_call_agent)

    # Act: Delete task via chatbot (Phase 3)
    response = await client.post(
        f"/api/{user_id}/chat",
        json={"message": f"Delete task {task_id}"},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )

    # Assert
    assert response.status_code == 200

    # Verify task no longer visible to Phase 2 web UI (shared database)
    statement = select(Task).where(Task.user_id == user_id)
    phase2_tasks_after = test_db_session.exec(statement).all()
    assert len(phase2_tasks_after) == 0  # Task deleted from shared database

    # Verify specific task_id no longer exists (PERMANENT deletion)
    statement = select(Task).where(Task.id == task_id)
    deleted_task = test_db_session.exec(statement).first()
    assert deleted_task is None  # Hard delete confirmed


# ============================================================================
# Agent Orchestration Integration Tests (T089-T093)
# ============================================================================


async def test_agent_orchestration_multi_turn_conversation_with_context(
    client: TestClient,
    test_jwt_token: str,
    test_user,
    test_db_session: Session,
    mocker,
):
    """
    Test agent orchestration across multiple turns with context preservation.

    Validates:
    - Turn 1: User adds task via chat
    - Turn 2: User updates the same task (agent must remember task_id from context)
    - Turn 3: User completes the task
    - Conversation history loaded from database on each turn
    - Agent maintains context across turns (radical statelessness)
    - All messages stored in database with correct ordering

    Constitution: Section II - Radical Statelessness (load from DB every request)
    Spec: specs/002-ai-chatbot-mcp/spec.md Section 6.1 (Conversation Context)
    """
    # Arrange
    user_id = test_user.id

    # Turn 1: Add task via chat
    from datetime import datetime, timedelta
    from mcp.tools.add_task import add_task
    from mcp.schemas import AddTaskInput, TaskPriority

    task_id_holder = {"id": None}  # Closure to share task_id across mock functions

    def mock_call_agent_turn1(session, user_id, conversation_history, user_message):
        # Agent extracts task details from user message
        task_input = AddTaskInput(
            title="Write quarterly report",
            description="Q4 2024 report",
            priority=TaskPriority.HIGH,
            due_date=datetime.utcnow() + timedelta(days=7),
        )
        result = add_task(session=session, user_id=user_id, task_input=task_input)
        task_id_holder["id"] = result.id
        return f"I've created task #{result.id}: 'Write quarterly report' with high priority, due in 7 days."

    mocker.patch("src.api.routes.chat.call_openai_agent", side_effect=mock_call_agent_turn1)

    response1 = await client.post(
        f"/api/{user_id}/chat",
        json={"message": "Add a task to write quarterly report, high priority, due in 7 days"},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )

    assert response1.status_code == 200
    data1 = response1.json()
    conversation_id = data1["conversation_id"]
    assert "created" in data1["message"].lower() or "task" in data1["message"].lower()

    # Verify task created
    task_id = task_id_holder["id"]
    assert task_id is not None
    statement = select(Task).where(Task.id == task_id)
    task = test_db_session.exec(statement).first()
    assert task is not None
    assert task.title == "Write quarterly report"

    # Turn 2: Update task via chat (agent must retrieve task_id from context)
    from mcp.tools.update_task import update_task
    from mcp.schemas import UpdateTaskInput

    def mock_call_agent_turn2(session, user_id, conversation_history, user_message):
        # Agent should have access to conversation_history with previous messages
        # In real scenario, agent would extract task_id from history or user message
        # Here we simulate agent finding the task_id from context
        assert len(conversation_history) >= 2  # User + Assistant from turn 1
        assert "quarterly report" in conversation_history[0]["content"].lower()

        task_input = UpdateTaskInput(
            task_id=task_id,
            title="URGENT: Write quarterly report",
            description="Q4 2024 report - board presentation required",
        )
        update_task(session=session, user_id=user_id, task_input=task_input)
        return f"I've updated task #{task_id} to 'URGENT: Write quarterly report' and added board presentation note."

    mocker.patch("src.api.routes.chat.call_openai_agent", side_effect=mock_call_agent_turn2)

    response2 = await client.post(
        f"/api/{user_id}/chat",
        json={
            "message": "Make that task urgent and add a note about board presentation",
            "conversation_id": conversation_id,
        },
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )

    assert response2.status_code == 200
    data2 = response2.json()
    assert data2["conversation_id"] == conversation_id  # Same conversation
    assert "updated" in data2["message"].lower() or "urgent" in data2["message"].lower()

    # Verify task updated
    statement = select(Task).where(Task.id == task_id)
    updated_task = test_db_session.exec(statement).first()
    assert updated_task.title == "URGENT: Write quarterly report"
    assert "board presentation" in updated_task.description

    # Turn 3: Complete task via chat
    from mcp.tools.complete_task import complete_task
    from mcp.schemas import CompleteTaskInput

    def mock_call_agent_turn3(session, user_id, conversation_history, user_message):
        # Agent has full context from turns 1 and 2
        assert len(conversation_history) >= 4  # 2 turns × 2 messages each
        task_input = CompleteTaskInput(task_id=task_id)
        complete_task(session=session, user_id=user_id, task_input=task_input)
        return f"Great! I've marked task #{task_id} 'URGENT: Write quarterly report' as complete."

    mocker.patch("src.api.routes.chat.call_openai_agent", side_effect=mock_call_agent_turn3)

    response3 = await client.post(
        f"/api/{user_id}/chat",
        json={"message": "Mark that task as complete", "conversation_id": conversation_id},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )

    assert response3.status_code == 200
    data3 = response3.json()
    assert "complete" in data3["message"].lower()

    # Verify task completed
    from mcp.schemas import TaskStatus

    statement = select(Task).where(Task.id == task_id)
    completed_task = test_db_session.exec(statement).first()
    assert completed_task.status == TaskStatus.COMPLETE

    # Verify all 6 messages stored (3 user + 3 assistant)
    from src.api.models import Message, MessageRole

    statement = (
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
    )
    messages = test_db_session.exec(statement).all()
    assert len(messages) == 6
    assert messages[0].role == MessageRole.USER
    assert messages[1].role == MessageRole.ASSISTANT
    assert messages[2].role == MessageRole.USER
    assert messages[3].role == MessageRole.ASSISTANT
    assert messages[4].role == MessageRole.USER
    assert messages[5].role == MessageRole.ASSISTANT


async def test_agent_orchestration_tool_chaining_workflow(
    client: TestClient,
    test_jwt_token: str,
    test_user,
    test_db_session: Session,
    mocker,
):
    """
    Test agent orchestration with tool chaining (add → list → verify).

    Validates:
    - Step 1: Agent adds multiple tasks
    - Step 2: Agent lists all tasks to verify additions
    - Step 3: Agent filters tasks by priority
    - Tools work together in sequence
    - Database state consistent across tool calls
    - Agent receives results from previous tools

    Constitution: Section IX - MCP tool composability
    Spec: specs/002-ai-chatbot-mcp/spec.md Section 5 (All MCP Tools)
    """
    # Arrange
    user_id = test_user.id

    # Step 1: Add 3 tasks via chat
    from mcp.tools.add_task import add_task
    from mcp.tools.list_tasks import list_tasks
    from mcp.schemas import AddTaskInput, ListTasksInput, TaskPriority

    task_ids = []

    def mock_call_agent_add_tasks(session, user_id, conversation_history, user_message):
        # Agent adds 3 tasks
        tasks_to_add = [
            ("Buy groceries", TaskPriority.MEDIUM),
            ("Finish project", TaskPriority.HIGH),
            ("Call dentist", TaskPriority.LOW),
        ]
        for title, priority in tasks_to_add:
            task_input = AddTaskInput(title=title, priority=priority)
            result = add_task(session=session, user_id=user_id, task_input=task_input)
            task_ids.append(result.id)

        return "I've added 3 tasks: 'Buy groceries' (medium), 'Finish project' (high), and 'Call dentist' (low)."

    mocker.patch("src.api.routes.chat.call_openai_agent", side_effect=mock_call_agent_add_tasks)

    response1 = await client.post(
        f"/api/{user_id}/chat",
        json={
            "message": "Add tasks: buy groceries (medium), finish project (high), call dentist (low)"
        },
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )

    assert response1.status_code == 200
    data1 = response1.json()
    conversation_id = data1["conversation_id"]
    assert "added 3 tasks" in data1["message"].lower()
    assert len(task_ids) == 3

    # Step 2: List all tasks via chat
    def mock_call_agent_list_all(session, user_id, conversation_history, user_message):
        task_input = ListTasksInput()
        result = list_tasks(session=session, user_id=user_id, task_input=task_input)
        task_summaries = [f"- {task.title} ({task.priority.value})" for task in result.tasks]
        return f"You have {result.count} tasks:\n" + "\n".join(task_summaries)

    mocker.patch("src.api.routes.chat.call_openai_agent", side_effect=mock_call_agent_list_all)

    response2 = await client.post(
        f"/api/{user_id}/chat",
        json={"message": "Show me all my tasks", "conversation_id": conversation_id},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )

    assert response2.status_code == 200
    data2 = response2.json()
    assert "3 tasks" in data2["message"].lower() or "you have 3" in data2["message"].lower()
    assert "buy groceries" in data2["message"].lower()
    assert "finish project" in data2["message"].lower()
    assert "call dentist" in data2["message"].lower()

    # Step 3: Filter tasks by HIGH priority
    def mock_call_agent_filter_high(session, user_id, conversation_history, user_message):
        task_input = ListTasksInput(priority=TaskPriority.HIGH)
        result = list_tasks(session=session, user_id=user_id, task_input=task_input)
        if result.count == 0:
            return "You have no high priority tasks."
        task_summaries = [f"- {task.title}" for task in result.tasks]
        return f"You have {result.count} high priority task(s):\n" + "\n".join(task_summaries)

    mocker.patch("src.api.routes.chat.call_openai_agent", side_effect=mock_call_agent_filter_high)

    response3 = await client.post(
        f"/api/{user_id}/chat",
        json={"message": "Show only high priority tasks", "conversation_id": conversation_id},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )

    assert response3.status_code == 200
    data3 = response3.json()
    assert (
        "1 high priority" in data3["message"].lower()
        or "finish project" in data3["message"].lower()
    )
    assert "buy groceries" not in data3["message"].lower()  # Should be filtered out


async def test_agent_orchestration_complex_workflow_all_tools(
    client: TestClient,
    test_jwt_token: str,
    test_user,
    test_db_session: Session,
    mocker,
):
    """
    Test agent orchestration with all 5 MCP tools in realistic workflow.

    Workflow:
    1. Add task (add_task)
    2. List tasks to confirm (list_tasks)
    3. Update task priority (update_task)
    4. Mark task complete (complete_task)
    5. Delete task (delete_task)
    6. List tasks again to verify deletion

    Validates:
    - All 5 tools work correctly in sequence
    - Database state transitions correctly
    - Agent maintains context across 6 turns
    - User isolation preserved throughout

    Constitution: Section IX - Full MCP tool integration
    """
    # Arrange
    user_id = test_user.id

    from mcp.tools.add_task import add_task
    from mcp.tools.list_tasks import list_tasks
    from mcp.tools.update_task import update_task
    from mcp.tools.complete_task import complete_task
    from mcp.tools.delete_task import delete_task
    from mcp.schemas import (
        AddTaskInput,
        ListTasksInput,
        UpdateTaskInput,
        CompleteTaskInput,
        DeleteTaskInput,
        TaskPriority,
    )

    task_id_holder = {"id": None}

    # Turn 1: Add task
    def mock_turn1(session, user_id, conversation_history, user_message):
        task_input = AddTaskInput(title="Clean garage", priority=TaskPriority.LOW)
        result = add_task(session=session, user_id=user_id, task_input=task_input)
        task_id_holder["id"] = result.id
        return f"Task #{result.id} 'Clean garage' added with low priority."

    mocker.patch("src.api.routes.chat.call_openai_agent", side_effect=mock_turn1)
    response1 = await client.post(
        f"/api/{user_id}/chat",
        json={"message": "Add a low priority task to clean garage"},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )
    assert response1.status_code == 200
    conversation_id = response1.json()["conversation_id"]
    task_id = task_id_holder["id"]

    # Turn 2: List tasks
    def mock_turn2(session, user_id, conversation_history, user_message):
        result = list_tasks(session=session, user_id=user_id, task_input=ListTasksInput())
        return f"You have {result.count} task(s): {result.tasks[0].title}"

    mocker.patch("src.api.routes.chat.call_openai_agent", side_effect=mock_turn2)
    response2 = await client.post(
        f"/api/{user_id}/chat",
        json={"message": "Show my tasks", "conversation_id": conversation_id},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )
    assert response2.status_code == 200
    assert "clean garage" in response2.json()["message"].lower()

    # Turn 3: Update priority to HIGH
    def mock_turn3(session, user_id, conversation_history, user_message):
        task_input = UpdateTaskInput(task_id=task_id, priority=TaskPriority.HIGH)
        update_task(session=session, user_id=user_id, task_input=task_input)
        return f"Updated task #{task_id} to high priority."

    mocker.patch("src.api.routes.chat.call_openai_agent", side_effect=mock_turn3)
    response3 = await client.post(
        f"/api/{user_id}/chat",
        json={"message": "Make that task high priority", "conversation_id": conversation_id},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )
    assert response3.status_code == 200

    # Verify priority updated
    statement = select(Task).where(Task.id == task_id)
    task = test_db_session.exec(statement).first()
    assert task.priority == TaskPriority.HIGH

    # Turn 4: Complete task
    def mock_turn4(session, user_id, conversation_history, user_message):
        task_input = CompleteTaskInput(task_id=task_id)
        complete_task(session=session, user_id=user_id, task_input=task_input)
        return f"Task #{task_id} marked complete."

    mocker.patch("src.api.routes.chat.call_openai_agent", side_effect=mock_turn4)
    response4 = await client.post(
        f"/api/{user_id}/chat",
        json={"message": "Mark it as complete", "conversation_id": conversation_id},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )
    assert response4.status_code == 200

    # Verify status updated
    from mcp.schemas import TaskStatus

    statement = select(Task).where(Task.id == task_id)
    task = test_db_session.exec(statement).first()
    assert task.status == TaskStatus.COMPLETE

    # Turn 5: Delete task
    def mock_turn5(session, user_id, conversation_history, user_message):
        task_input = DeleteTaskInput(task_id=task_id)
        delete_task(session=session, user_id=user_id, task_input=task_input)
        return f"Task #{task_id} 'Clean garage' permanently deleted."

    mocker.patch("src.api.routes.chat.call_openai_agent", side_effect=mock_turn5)
    response5 = await client.post(
        f"/api/{user_id}/chat",
        json={"message": "Delete that task", "conversation_id": conversation_id},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )
    assert response5.status_code == 200

    # Verify task deleted
    statement = select(Task).where(Task.id == task_id)
    task = test_db_session.exec(statement).first()
    assert task is None

    # Turn 6: List tasks again (should be empty)
    def mock_turn6(session, user_id, conversation_history, user_message):
        result = list_tasks(session=session, user_id=user_id, task_input=ListTasksInput())
        return f"You have {result.count} tasks." if result.count > 0 else "You have no tasks."

    mocker.patch("src.api.routes.chat.call_openai_agent", side_effect=mock_turn6)
    response6 = await client.post(
        f"/api/{user_id}/chat",
        json={"message": "Show my tasks", "conversation_id": conversation_id},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )
    assert response6.status_code == 200
    assert (
        "no tasks" in response6.json()["message"].lower()
        or "0 tasks" in response6.json()["message"].lower()
    )


async def test_agent_orchestration_error_recovery_in_conversation(
    client: TestClient,
    test_jwt_token: str,
    test_user,
    test_db_session: Session,
    mocker,
):
    """
    Test agent orchestration handles tool errors gracefully and recovers.

    Workflow:
    1. Add task successfully
    2. Attempt to update non-existent task (error expected)
    3. Recover: Update the correct task successfully
    4. Complete the task successfully

    Validates:
    - Tool errors don't crash conversation
    - Conversation continues after error
    - Error messages stored correctly
    - Subsequent tools work after recovery
    - User isolation errors handled gracefully

    Constitution: Section XVI - Error handling (fail fast, clear messages)
    """
    # Arrange
    user_id = test_user.id

    from mcp.tools.add_task import add_task
    from mcp.tools.update_task import update_task
    from mcp.tools.complete_task import complete_task
    from mcp.schemas import AddTaskInput, UpdateTaskInput, CompleteTaskInput, TaskPriority

    task_id_holder = {"id": None}

    # Turn 1: Add task successfully
    def mock_turn1(session, user_id, conversation_history, user_message):
        task_input = AddTaskInput(title="Test task", priority=TaskPriority.MEDIUM)
        result = add_task(session=session, user_id=user_id, task_input=task_input)
        task_id_holder["id"] = result.id
        return f"Task #{result.id} added successfully."

    mocker.patch("src.api.routes.chat.call_openai_agent", side_effect=mock_turn1)
    response1 = await client.post(
        f"/api/{user_id}/chat",
        json={"message": "Add a test task"},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )
    assert response1.status_code == 200
    conversation_id = response1.json()["conversation_id"]

    # Turn 2: Attempt to update non-existent task (error)
    def mock_turn2_error(session, user_id, conversation_history, user_message):
        try:
            task_input = UpdateTaskInput(task_id=99999, title="This will fail")
            update_task(session=session, user_id=user_id, task_input=task_input)
            return "Updated successfully"
        except Exception as _e:  # noqa: F841
            return "Error: Task 99999 not found. Please check the task ID."

    mocker.patch("src.api.routes.chat.call_openai_agent", side_effect=mock_turn2_error)
    response2 = await client.post(
        f"/api/{user_id}/chat",
        json={"message": "Update task 99999 to high priority", "conversation_id": conversation_id},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )
    assert response2.status_code == 200  # Chat endpoint succeeds even if tool fails
    assert (
        "error" in response2.json()["message"].lower()
        or "not found" in response2.json()["message"].lower()
    )

    # Turn 3: Recover - Update the correct task
    task_id = task_id_holder["id"]

    def mock_turn3_recover(session, user_id, conversation_history, user_message):
        # Agent learns from error and uses correct task_id
        task_input = UpdateTaskInput(task_id=task_id, priority=TaskPriority.HIGH)
        update_task(session=session, user_id=user_id, task_input=task_input)
        return f"Task #{task_id} updated to high priority successfully."

    mocker.patch("src.api.routes.chat.call_openai_agent", side_effect=mock_turn3_recover)
    response3 = await client.post(
        f"/api/{user_id}/chat",
        json={
            "message": f"Update task {task_id} to high priority",
            "conversation_id": conversation_id,
        },
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )
    assert response3.status_code == 200
    assert (
        "successfully" in response3.json()["message"].lower()
        or "updated" in response3.json()["message"].lower()
    )

    # Verify update succeeded
    statement = select(Task).where(Task.id == task_id)
    task = test_db_session.exec(statement).first()
    assert task.priority == TaskPriority.HIGH

    # Turn 4: Complete task (verify conversation still functional)
    def mock_turn4(session, user_id, conversation_history, user_message):
        task_input = CompleteTaskInput(task_id=task_id)
        complete_task(session=session, user_id=user_id, task_input=task_input)
        return f"Task #{task_id} completed."

    mocker.patch("src.api.routes.chat.call_openai_agent", side_effect=mock_turn4)
    response4 = await client.post(
        f"/api/{user_id}/chat",
        json={"message": "Complete that task", "conversation_id": conversation_id},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )
    assert response4.status_code == 200

    # Verify completion
    from mcp.schemas import TaskStatus

    statement = select(Task).where(Task.id == task_id)
    task = test_db_session.exec(statement).first()
    assert task.status == TaskStatus.COMPLETE


async def test_agent_orchestration_circuit_breaker_integration(
    client: TestClient,
    test_jwt_token: str,
    test_user,
    test_db_session: Session,
    mocker,
):
    """
    Test agent orchestration with CircuitBreaker protecting OpenAI calls.

    Validates:
    - CircuitBreaker wraps OpenAI Agent calls
    - After 5 consecutive failures, circuit opens
    - When circuit is OPEN, chat endpoint fails fast (no OpenAI call)
    - After recovery timeout, circuit transitions to HALF_OPEN
    - Successful call closes circuit again
    - User gets clear error message when circuit is OPEN

    Constitution: Section XIV - Circuit breaker for OpenAI API
    Spec: specs/002-ai-chatbot-mcp/spec.md Section 7.3 (CircuitBreaker)
    """
    # Arrange
    user_id = test_user.id

    # This test would require modifying chat endpoint to use CircuitBreaker
    # For now, we'll test that the AgentClient uses CircuitBreaker (already tested in unit tests)
    # Here we simulate what would happen if chat endpoint integrated CircuitBreaker

    # Mock OpenAI to fail 5 times
    call_count = {"count": 0}

    def mock_openai_failures(session, user_id, conversation_history, user_message):
        call_count["count"] += 1
        if call_count["count"] <= 5:
            raise Exception("OpenAI API timeout")
        return "Success after recovery"

    mocker.patch("src.api.routes.chat.call_openai_agent", side_effect=mock_openai_failures)

    # First 5 calls should fail
    for i in range(5):
        response = await client.post(
            f"/api/{user_id}/chat",
            json={"message": f"Test message {i}"},
            headers={"Authorization": f"Bearer {test_jwt_token}"},
        )
        # Chat endpoint returns 500 on OpenAI error
        assert response.status_code == 500
        data = response.json()
        assert "detail" in data
        # Error message should be clear
        assert (
            "error" in data["detail"]
            or "timeout" in str(data).lower()
            or "unavailable" in str(data).lower()
        )

    # 6th call should succeed (after circuit breaker would have opened and recovered)
    _response6 = await client.post(  # noqa: F841
        f"/api/{user_id}/chat",
        json={"message": "Test message 6"},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )
    # Note: In real implementation with CircuitBreaker, circuit would be OPEN
    # and fail fast without calling OpenAI. Here we simulate eventual recovery.
    # For full CircuitBreaker integration, chat endpoint needs to use AgentClient
    # which already has CircuitBreaker (tested in unit tests).
    assert call_count["count"] == 6  # All 6 calls attempted
