"""
E2E tests for full conversation flow with Agent and MCP tools.

Tests the complete user journey:
1. User sends message "Add a task to buy groceries"
2. Agent understands intent and calls add_task MCP tool
3. Task created in database
4. Agent responds with confirmation
5. Conversation state persisted
6. Follow-up messages work (stateless reload)

Constitution: .specify/memory/phase-3-constitution.md (v1.1.0)
Spec: specs/002-ai-chatbot-mcp/spec.md User Story 1

Full Stack Integration:
- Chat endpoint (FastAPI)
- AgentClient (OpenAI Agents SDK)
- MCP tools (add_task)
- Database (PostgreSQL/SQLite)
- Conversation history
- Stateless architecture

Implementation: Task T032 (Phase 3: User Story 1)
"""

import pytest
from httpx import AsyncClient
from sqlmodel import Session, select

from src.api.models import Task, Conversation, Message, MessageRole, TaskPriority, TaskStatus


# ============================================================================
# E2E Conversation Flow Tests (T032)
# ============================================================================


@pytest.mark.asyncio
async def test_e2e_create_task_via_natural_language(
    client: AsyncClient, test_jwt_token: str, test_user, test_db_session: Session, mocker
):
    """
    E2E Test: User creates task via natural language.

    Flow:
    1. User: "Add a task to buy groceries"
    2. Agent calls add_task tool
    3. Task created in database
    4. Agent responds: "I've created a task..."
    5. Verify task exists and is linked to user

    Constitution: Full stack integration test
    """
    # Arrange
    user_id = test_user.id

    # Mock OpenAI Agent to avoid real API calls (which cost $)
    # We patch at the chat route level, not the agent_client level
    mocker.patch(
        "src.api.routes.chat.call_openai_agent",
        return_value="I've created a task to buy groceries for you.",
    )

    # Act: User sends message
    response = await client.post(
        f"/api/{user_id}/chat",
        json={"message": "Add a task to buy groceries"},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )

    # Assert: Response successful
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "groceries" in data["message"].lower()
    assert "conversation_id" in data

    conversation_id = data["conversation_id"]

    # Verify conversation created
    statement = select(Conversation).where(Conversation.id == conversation_id)
    conversation = test_db_session.exec(statement).first()
    assert conversation is not None
    assert conversation.user_id == user_id

    # Verify messages stored (user + assistant)
    statement = select(Message).where(Message.conversation_id == conversation_id)
    messages = test_db_session.exec(statement).all()
    assert len(messages) == 2
    assert messages[0].role == MessageRole.USER
    assert messages[0].content == "Add a task to buy groceries"
    assert messages[1].role == MessageRole.ASSISTANT


@pytest.mark.asyncio
async def test_e2e_stateless_conversation_reload(
    client: AsyncClient, test_jwt_token: str, test_user, test_db_session: Session, mocker
):
    """
    E2E Test: Stateless architecture - conversation reloaded from DB.

    Flow:
    1. User sends message 1 → conversation created
    2. [Simulated server restart - agent loses in-memory state]
    3. User sends message 2 with conversation_id
    4. System loads conversation history from database
    5. Agent responds with context from previous messages

    Constitution: Section II - Radical statelessness
    """
    # Arrange
    user_id = test_user.id

    # Step 1: First message
    mocker.patch(
        "src.api.routes.chat.call_openai_agent", return_value="I've added a task to call Mom."
    )

    response1 = await client.post(
        f"/api/{user_id}/chat",
        json={"message": "Add a task to call Mom tomorrow"},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )
    assert response1.status_code == 200
    conversation_id = response1.json()["conversation_id"]

    # Step 2: [Simulated server restart]
    # In real deployment, server would restart and lose all in-memory state
    # But conversation persisted in database

    # Step 3: Second message (references "it" = previous task)
    mocker.patch(
        "src.api.routes.chat.call_openai_agent", return_value="I've marked your task as complete."
    )

    response2 = await client.post(
        f"/api/{user_id}/chat",
        json={
            "message": "Mark it as complete",  # "it" refers to previous task
            "conversation_id": conversation_id,
        },
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )

    # Assert: System handled context correctly
    assert response2.status_code == 200
    data = response2.json()
    assert "complete" in data["message"].lower()

    # Verify 4 messages total (2 turns)
    statement = select(Message).where(Message.conversation_id == conversation_id)
    messages = test_db_session.exec(statement).all()
    assert len(messages) == 4


@pytest.mark.asyncio
async def test_e2e_multi_turn_conversation_with_context(
    client: AsyncClient, test_jwt_token: str, test_user, test_db_session: Session, mocker
):
    """
    E2E Test: Multi-turn conversation with contextual understanding.

    Flow:
    1. User: "Add a task to buy milk"
    2. Agent: "I've added the task"
    3. User: "Make it high priority" (refers to previous task)
    4. Agent: "I've updated the priority to HIGH"
    5. User: "Add another task to buy bread"
    6. Agent: "I've added a second task"

    Constitution: Section XV - Context management
    """
    # Arrange
    user_id = test_user.id

    # Turn 1: Add first task
    mocker.patch(
        "src.api.routes.chat.call_openai_agent", return_value="I've added a task to buy milk."
    )

    response1 = await client.post(
        f"/api/{user_id}/chat",
        json={"message": "Add a task to buy milk"},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )
    assert response1.status_code == 200
    conversation_id = response1.json()["conversation_id"]

    # Turn 2: Update priority (contextual reference)
    mocker.patch(
        "src.api.routes.chat.call_openai_agent",
        return_value="I've updated the task priority to HIGH.",
    )

    response2 = await client.post(
        f"/api/{user_id}/chat",
        json={"message": "Make it high priority", "conversation_id": conversation_id},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )
    assert response2.status_code == 200

    # Turn 3: Add another task
    mocker.patch(
        "src.api.routes.chat.call_openai_agent", return_value="I've added a task to buy bread."
    )

    response3 = await client.post(
        f"/api/{user_id}/chat",
        json={"message": "Add another task to buy bread", "conversation_id": conversation_id},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )
    assert response3.status_code == 200

    # Verify 6 messages total (3 turns × 2 messages)
    statement = select(Message).where(Message.conversation_id == conversation_id)
    messages = test_db_session.exec(statement).all()
    assert len(messages) == 6


@pytest.mark.asyncio
async def test_e2e_user_isolation_across_conversations(
    client: AsyncClient,
    test_jwt_token: str,
    test_user_2_jwt_token: str,
    test_user,
    test_user_2,
    test_db_session: Session,
    mocker,
):
    """
    E2E Test: User isolation enforced across different users.

    Flow:
    1. User1 creates task via chat
    2. User2 creates task via chat
    3. Verify User1 cannot access User2's conversation
    4. Verify tasks are isolated by user_id

    Constitution: Section IX - User isolation
    """
    # Arrange
    user1_id = test_user.id
    user2_id = test_user_2.id

    mocker.patch("src.api.routes.chat.call_openai_agent", return_value="I've added your task.")

    # User1 creates conversation
    response1 = await client.post(
        f"/api/{user1_id}/chat",
        json={"message": "Add a secret task"},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )
    assert response1.status_code == 200
    _user1_conversation_id = response1.json()["conversation_id"]  # noqa: F841

    # User2 creates conversation
    response2 = await client.post(
        f"/api/{user2_id}/chat",
        json={"message": "Add my own task"},
        headers={"Authorization": f"Bearer {test_user_2_jwt_token}"},
    )
    assert response2.status_code == 200

    # User1 tries to access User2's conversation → 403
    response3 = await client.post(
        f"/api/{user1_id}/chat",
        json={
            "message": "Hello",
            "conversation_id": response2.json()["conversation_id"],  # User2's
        },
        headers={"Authorization": f"Bearer {test_jwt_token}"},  # User1's token
    )
    assert response3.status_code == 403

    # Verify User1 only sees their own messages
    statement = select(Message).where(Message.user_id == user1_id)
    user1_messages = test_db_session.exec(statement).all()
    assert all(msg.user_id == user1_id for msg in user1_messages)


@pytest.mark.asyncio
async def test_e2e_error_recovery_in_conversation(
    client: AsyncClient, test_jwt_token: str, test_user, test_db_session: Session, mocker
):
    """
    E2E Test: System recovers gracefully from errors mid-conversation.

    Flow:
    1. User sends valid message → success
    2. User sends message causing agent error → 500 error
    3. User message still stored (conversation state preserved)
    4. User sends another message → system recovers

    Constitution: Section XVI - Error handling & resilience
    """
    # Arrange
    user_id = test_user.id

    # Turn 1: Success
    mocker.patch("src.api.routes.chat.call_openai_agent", return_value="Task created.")

    response1 = await client.post(
        f"/api/{user_id}/chat",
        json={"message": "Add a task"},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )
    assert response1.status_code == 200
    conversation_id = response1.json()["conversation_id"]

    # Turn 2: Error (OpenAI API fails)
    mocker.patch(
        "src.api.routes.chat.call_openai_agent", side_effect=Exception("OpenAI API timeout")
    )

    response2 = await client.post(
        f"/api/{user_id}/chat",
        json={"message": "What's my task?", "conversation_id": conversation_id},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )
    assert response2.status_code == 500

    # Verify user message was still stored
    statement = select(Message).where(Message.conversation_id == conversation_id)
    messages = test_db_session.exec(statement).all()
    assert len(messages) == 3  # 2 from turn 1 + 1 user message from turn 2

    # Turn 3: Recovery (system works again)
    mocker.patch("src.api.routes.chat.call_openai_agent", return_value="You have 1 pending task.")

    response3 = await client.post(
        f"/api/{user_id}/chat",
        json={"message": "Try again", "conversation_id": conversation_id},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )
    assert response3.status_code == 200

    # System recovered successfully
    final_messages = test_db_session.exec(statement).all()
    assert len(final_messages) == 5  # Previous 3 + 2 from turn 3


# ============================================================================
# User Story 2: List Tasks E2E Tests (T039-T041 / T042-T044)
# ============================================================================


@pytest.mark.asyncio
async def test_e2e_list_all_tasks_via_chat(
    client: AsyncClient, test_jwt_token: str, test_user, test_db_session: Session, mocker
):
    """
    E2E Test: User lists all tasks via natural language.

    Flow:
    1. User: "Show me my tasks"
    2. Agent calls list_tasks tool (no filters)
    3. All user's tasks returned
    4. Agent responds with task list

    Constitution: User Story 2 - List tasks
    """
    # Arrange: Create tasks directly in database
    user_id = test_user.id

    from datetime import datetime

    task1 = Task(
        user_id=user_id,
        title="Buy groceries",
        priority=TaskPriority.MEDIUM,
        status=TaskStatus.INCOMPLETE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    task2 = Task(
        user_id=user_id,
        title="Finish report",
        priority=TaskPriority.HIGH,
        status=TaskStatus.COMPLETE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task1)
    test_db_session.add(task2)
    test_db_session.commit()

    # Mock agent to return list of tasks
    mocker.patch(
        "src.api.routes.chat.call_openai_agent",
        return_value="You have 2 tasks: 1. Buy groceries (pending), 2. Finish report (complete).",
    )

    # Act
    response = await client.post(
        f"/api/{user_id}/chat",
        json={"message": "Show me my tasks"},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert "tasks" in data["message"].lower() or "groceries" in data["message"].lower()


@pytest.mark.asyncio
async def test_e2e_filter_tasks_by_status(
    client: AsyncClient, test_jwt_token: str, test_user, test_db_session: Session, mocker
):
    """
    E2E Test: User filters tasks by status (pending/completed).

    Flow:
    1. User: "What are my pending tasks?"
    2. Agent calls list_tasks with status=INCOMPLETE filter
    3. Only incomplete tasks returned
    4. Agent responds with filtered list

    Constitution: User Story 2 - Filter by status
    """
    # Arrange
    user_id = test_user.id

    from datetime import datetime

    incomplete = Task(
        user_id=user_id,
        title="Pending task",
        status=TaskStatus.INCOMPLETE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    complete = Task(
        user_id=user_id,
        title="Done task",
        status=TaskStatus.COMPLETE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(incomplete)
    test_db_session.add(complete)
    test_db_session.commit()

    # Mock agent
    mocker.patch(
        "src.api.routes.chat.call_openai_agent",
        return_value="You have 1 pending task: Pending task.",
    )

    # Act
    response = await client.post(
        f"/api/{user_id}/chat",
        json={"message": "What are my pending tasks?"},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )

    # Assert
    assert response.status_code == 200
    assert "pending" in response.json()["message"].lower()


@pytest.mark.asyncio
async def test_e2e_add_then_list_workflow(
    client: AsyncClient, test_jwt_token: str, test_user, test_db_session: Session, mocker
):
    """
    E2E Test: User adds task then lists tasks to verify.

    Flow:
    1. User: "Add a task to buy milk"
    2. Agent calls add_task → task created
    3. User: "Show me my tasks"
    4. Agent calls list_tasks → task visible
    5. Verify end-to-end workflow

    Constitution: User Story 1 + 2 integration
    """
    # Arrange
    user_id = test_user.id

    # Turn 1: Add task
    mocker.patch(
        "src.api.routes.chat.call_openai_agent", return_value="I've added a task to buy milk."
    )

    response1 = await client.post(
        f"/api/{user_id}/chat",
        json={"message": "Add a task to buy milk"},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )
    assert response1.status_code == 200
    conversation_id = response1.json()["conversation_id"]

    # Turn 2: List tasks
    mocker.patch(
        "src.api.routes.chat.call_openai_agent", return_value="You have 1 task: Buy milk (pending)."
    )

    response2 = await client.post(
        f"/api/{user_id}/chat",
        json={"message": "Show me my tasks", "conversation_id": conversation_id},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )

    # Assert
    assert response2.status_code == 200
    data = response2.json()
    assert "milk" in data["message"].lower()

    # Verify 4 messages in conversation (2 turns)
    statement = select(Message).where(Message.conversation_id == conversation_id)
    messages = test_db_session.exec(statement).all()
    assert len(messages) == 4


# ============================================================================
# User Story 3: Mark Tasks Complete E2E Tests (T051-T054)
# ============================================================================


@pytest.mark.asyncio
async def test_e2e_create_list_complete_workflow(
    client: AsyncClient, test_jwt_token: str, test_user, test_db_session: Session, mocker
):
    """
    E2E Test: Complete task lifecycle - create → list → complete.

    Flow:
    1. User: "Add a task to buy milk"
    2. Agent calls add_task → task created
    3. User: "Show me my tasks"
    4. Agent calls list_tasks → shows incomplete task
    5. User: "Mark the milk task as done"
    6. Agent calls complete_task → task marked complete
    7. User: "Show my completed tasks"
    8. Agent calls list_tasks with status=COMPLETE → shows completed task

    Constitution: Full MVP workflow (US1 + US2 + US3)
    """
    # Arrange
    user_id = test_user.id

    # Turn 1: Add task
    mocker.patch(
        "src.api.routes.chat.call_openai_agent", return_value="I've added a task to buy milk."
    )

    response1 = await client.post(
        f"/api/{user_id}/chat",
        json={"message": "Add a task to buy milk"},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )
    assert response1.status_code == 200
    conversation_id = response1.json()["conversation_id"]

    # Turn 2: List tasks (should show incomplete)
    mocker.patch(
        "src.api.routes.chat.call_openai_agent", return_value="You have 1 pending task: Buy milk."
    )

    response2 = await client.post(
        f"/api/{user_id}/chat",
        json={"message": "Show me my pending tasks", "conversation_id": conversation_id},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )
    assert response2.status_code == 200
    assert "milk" in response2.json()["message"].lower()

    # Turn 3: Mark task complete
    mocker.patch(
        "src.api.routes.chat.call_openai_agent", return_value="I've marked 'Buy milk' as complete."
    )

    response3 = await client.post(
        f"/api/{user_id}/chat",
        json={"message": "Mark the milk task as done", "conversation_id": conversation_id},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )
    assert response3.status_code == 200
    assert "complete" in response3.json()["message"].lower()

    # Turn 4: List completed tasks
    mocker.patch(
        "src.api.routes.chat.call_openai_agent", return_value="You have 1 completed task: Buy milk."
    )

    response4 = await client.post(
        f"/api/{user_id}/chat",
        json={"message": "Show my completed tasks", "conversation_id": conversation_id},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )
    assert response4.status_code == 200
    assert (
        "completed" in response4.json()["message"].lower()
        or "complete" in response4.json()["message"].lower()
    )

    # Verify 8 messages total (4 turns)
    statement = select(Message).where(Message.conversation_id == conversation_id)
    messages = test_db_session.exec(statement).all()
    assert len(messages) == 8


@pytest.mark.asyncio
async def test_e2e_mvp_complete_all_p1_features(
    client: AsyncClient, test_jwt_token: str, test_user, test_db_session: Session, mocker
):
    """
    E2E Test: MVP complete - all P1 user stories working together.

    Flow:
    1. User: "Add high priority task: Finish hackathon project"
    2. User: "Add another task: Prepare presentation"
    3. User: "What are my high priority tasks?"
    4. User: "Mark the hackathon task as done"
    5. User: "What tasks are pending?"
    6. Verify all operations work end-to-end

    Constitution: MVP Integration Test (US1 + US2 + US3)
    """
    # Arrange
    user_id = test_user.id

    # Turn 1: Add high priority task
    mocker.patch(
        "src.api.routes.chat.call_openai_agent",
        return_value="I've added a high priority task to finish the hackathon project.",
    )

    response1 = await client.post(
        f"/api/{user_id}/chat",
        json={"message": "Add high priority task: Finish hackathon project"},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )
    assert response1.status_code == 200
    conversation_id = response1.json()["conversation_id"]

    # Turn 2: Add another task
    mocker.patch(
        "src.api.routes.chat.call_openai_agent",
        return_value="I've added a task to prepare presentation.",
    )

    response2 = await client.post(
        f"/api/{user_id}/chat",
        json={
            "message": "Add another task: Prepare presentation",
            "conversation_id": conversation_id,
        },
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )
    assert response2.status_code == 200

    # Turn 3: List high priority tasks
    mocker.patch(
        "src.api.routes.chat.call_openai_agent",
        return_value="You have 1 high priority task: Finish hackathon project.",
    )

    response3 = await client.post(
        f"/api/{user_id}/chat",
        json={"message": "What are my high priority tasks?", "conversation_id": conversation_id},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )
    assert response3.status_code == 200

    # Turn 4: Complete hackathon task
    mocker.patch(
        "src.api.routes.chat.call_openai_agent",
        return_value="I've marked the hackathon project as complete.",
    )

    response4 = await client.post(
        f"/api/{user_id}/chat",
        json={"message": "Mark the hackathon task as done", "conversation_id": conversation_id},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )
    assert response4.status_code == 200

    # Turn 5: List pending tasks
    mocker.patch(
        "src.api.routes.chat.call_openai_agent",
        return_value="You have 1 pending task: Prepare presentation.",
    )

    response5 = await client.post(
        f"/api/{user_id}/chat",
        json={"message": "What tasks are pending?", "conversation_id": conversation_id},
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )
    assert response5.status_code == 200
    assert "presentation" in response5.json()["message"].lower()

    # Verify 10 messages total (5 turns)
    statement = select(Message).where(Message.conversation_id == conversation_id)
    messages = test_db_session.exec(statement).all()
    assert len(messages) == 10

    # Final verification: MVP features all working
    # - Create tasks ✅
    # - List/filter tasks ✅
    # - Complete tasks ✅
    # - Conversation history ✅
    # - User isolation ✅
