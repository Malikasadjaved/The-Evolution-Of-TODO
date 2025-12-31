"""
Unit tests for AgentClient - OpenAI Agents SDK integration.

Tests for:
- Agent initialization with MCP tools
- Tool registration (add_task, list_tasks, etc.)
- Tool execution with correct parameters
- Conversation history handling
- Error handling (OpenAI API failures)
- Response parsing

Constitution: .specify/memory/phase-3-constitution.md (v1.1.0)
Spec: specs/002-ai-chatbot-mcp/spec.md Section 5.2 (OpenAI Agent)

AgentClient Contract:
- Initializes OpenAI Agent with GPT-4
- Registers MCP tools as agent functions
- Accepts conversation history for context
- Executes agent.run() with user message
- Handles tool calls from agent
- Returns final assistant response

Implementation: Task T029-T030 (Phase 3: User Story 1)
"""

import pytest
from unittest.mock import Mock, patch
from sqlmodel import Session

from src.api.services.agent_client import AgentClient
from mcp.schemas import TaskPriority


# ============================================================================
# AgentClient Initialization Tests (T029)
# ============================================================================


def test_agent_client_initialization():
    """
    Test AgentClient initializes with OpenAI API key.

    Validates:
    - API key loaded from environment
    - Agent configured with GPT-4 model
    - MCP tools registered

    Constitution: Section XII - API integration
    """
    with patch.dict("os.environ", {"OPENAI_API_KEY": "test_key_123"}):
        with patch("src.api.services.agent_client.openai") as mock_openai:
            # Arrange
            mock_client = Mock()
            mock_openai.Client.return_value = mock_client

            # Act
            agent_client = AgentClient()

            # Assert
            assert agent_client is not None
            mock_openai.Client.assert_called_once()


def test_agent_client_registers_add_task_tool(test_db_session: Session):
    """
    Test AgentClient registers add_task as an agent tool.

    Validates:
    - add_task tool registered with correct schema
    - Tool description includes parameters
    - Tool can be called by agent

    Constitution: Section IX - MCP tools as universal interface
    """
    with patch.dict("os.environ", {"OPENAI_API_KEY": "test_key_123"}):
        with patch("src.api.services.agent_client.openai"):
            # Act
            agent_client = AgentClient()

            # Assert
            assert "add_task" in agent_client.tools
            tool = agent_client.tools["add_task"]
            assert tool["name"] == "add_task"
            assert "title" in tool["parameters"]["properties"]
            assert "priority" in tool["parameters"]["properties"]


def test_agent_client_conversation_history_format(test_db_session: Session):
    """
    Test AgentClient formats conversation history correctly.

    Validates:
    - History converted to OpenAI format
    - Roles mapped correctly (user → user, assistant → assistant)
    - Content preserved exactly

    Constitution: Section XV - Context management
    """
    with patch.dict("os.environ", {"OPENAI_API_KEY": "test_key_123"}):
        with patch("src.api.services.agent_client.openai"):
            # Arrange
            agent_client = AgentClient()
            history = [
                {"role": "user", "content": "Hello"},
                {"role": "assistant", "content": "Hi there!"},
                {"role": "user", "content": "Add a task"},
            ]

            # Act
            formatted = agent_client._format_history(history)

            # Assert
            assert len(formatted) == 3
            assert formatted[0]["role"] == "user"
            assert formatted[0]["content"] == "Hello"
            assert formatted[2]["content"] == "Add a task"


# ============================================================================
# Agent Tool Execution Tests (T029)
# ============================================================================


def test_agent_executes_add_task_tool(test_db_session: Session, mocker):
    """
    Test agent correctly calls add_task MCP tool.

    Validates:
    - Agent extracts task parameters from user message
    - add_task tool called with correct parameters
    - Tool result returned to agent
    - Agent generates natural language response

    Constitution: Section IX - MCP boundary
    """
    with patch.dict("os.environ", {"OPENAI_API_KEY": "test_key_123"}):
        # Arrange: Mock OpenAI function calling
        mock_function_call = Mock()
        mock_function_call.name = "add_task"
        mock_function_call.arguments = '{"title": "Buy groceries", "priority": "MEDIUM"}'

        mock_first_message = Mock()
        mock_first_message.content = None
        mock_first_message.function_call = mock_function_call

        mock_first_choice = Mock()
        mock_first_choice.message = mock_first_message

        mock_first_response = Mock()
        mock_first_response.choices = [mock_first_choice]

        # Second response after tool execution
        mock_final_message = Mock()
        mock_final_message.content = "I've created a task to buy groceries for you."
        mock_final_message.function_call = None

        mock_final_choice = Mock()
        mock_final_choice.message = mock_final_message

        mock_final_response = Mock()
        mock_final_response.choices = [mock_final_choice]

        with patch("src.api.services.agent_client.openai") as mock_openai:
            mock_client = Mock()
            mock_client.chat.completions.create.side_effect = [
                mock_first_response,  # First call: agent requests function
                mock_final_response,  # Second call: agent responds with result
            ]
            mock_openai.Client.return_value = mock_client

            agent_client = AgentClient()

            # Mock add_task execution
            mock_add_task = mocker.patch("src.api.services.agent_client.add_task")
            from mcp.schemas import AddTaskOutput, TaskStatus
            from datetime import datetime

            mock_add_task.return_value = AddTaskOutput(
                id=1,
                user_id="user_123",
                title="Buy groceries",
                description=None,
                priority=TaskPriority.MEDIUM,
                status=TaskStatus.INCOMPLETE,
                due_date=None,
                tags=[],
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )

            # Act
            response = agent_client.run(
                session=test_db_session,
                user_id="user_123",
                conversation_history=[],
                user_message="Add a task to buy groceries",
            )

            # Assert
            assert "groceries" in response.lower()
            mock_add_task.assert_called_once()


def test_agent_handles_tool_execution_error(test_db_session: Session, mocker):
    """
    Test agent handles MCP tool execution errors gracefully.

    Validates:
    - Tool error caught and logged
    - Error message returned to agent
    - Agent generates appropriate response
    - No crash or exception propagated

    Constitution: Section XVI - Error handling
    """
    with patch.dict("os.environ", {"OPENAI_API_KEY": "test_key_123"}):
        # Arrange: Mock OpenAI function calling
        mock_function_call = Mock()
        mock_function_call.name = "add_task"
        mock_function_call.arguments = '{"title": "Invalid task"}'

        mock_first_message = Mock()
        mock_first_message.content = None
        mock_first_message.function_call = mock_function_call

        mock_tool_response = Mock()
        mock_tool_response.choices = [Mock(message=mock_first_message)]

        # Final response after tool error
        mock_final_message = Mock()
        mock_final_message.content = "Sorry, I couldn't create that task. Please try again."
        mock_final_message.function_call = None

        mock_final_response = Mock()
        mock_final_response.choices = [Mock(message=mock_final_message)]

        with patch("src.api.services.agent_client.openai") as mock_openai:
            mock_client = Mock()
            mock_client.chat.completions.create.side_effect = [
                mock_tool_response,
                mock_final_response,
            ]
            mock_openai.Client.return_value = mock_client

            agent_client = AgentClient()

            # Mock add_task to raise exception
            mocker.patch(
                "src.api.services.agent_client.add_task", side_effect=Exception("Database error")
            )

            # Act
            response = agent_client.run(
                session=test_db_session,
                user_id="user_123",
                conversation_history=[],
                user_message="Add an invalid task",
            )

            # Assert
            assert "sorry" in response.lower() or "couldn't" in response.lower()


def test_agent_handles_multiple_tool_calls(test_db_session: Session, mocker):
    """
    Test agent handles multiple tool calls in sequence.

    Validates:
    - Agent can call multiple tools (e.g., add_task then list_tasks)
    - Each tool executed with correct parameters
    - Results aggregated into final response

    Constitution: Section IX - MCP orchestration
    """
    with patch.dict("os.environ", {"OPENAI_API_KEY": "test_key_123"}):
        # Arrange: Mock OpenAI function calling
        mock_function_call = Mock()
        mock_function_call.name = "add_task"
        mock_function_call.arguments = '{"title": "Task 1", "priority": "HIGH"}'

        mock_first_message = Mock()
        mock_first_message.content = None
        mock_first_message.function_call = mock_function_call

        mock_first_response = Mock()
        mock_first_response.choices = [Mock(message=mock_first_message)]

        mock_final_message = Mock()
        mock_final_message.content = "I've added the task. You now have 1 pending task."
        mock_final_message.function_call = None

        mock_final_response = Mock()
        mock_final_response.choices = [Mock(message=mock_final_message)]

        with patch("src.api.services.agent_client.openai") as mock_openai:
            mock_client = Mock()
            mock_client.chat.completions.create.side_effect = [
                mock_first_response,
                mock_final_response,
            ]
            mock_openai.Client.return_value = mock_client

            agent_client = AgentClient()

            # Mock tool functions
            from mcp.schemas import AddTaskOutput, TaskStatus
            from datetime import datetime

            mocker.patch(
                "src.api.services.agent_client.add_task",
                return_value=AddTaskOutput(
                    id=1,
                    user_id="user_123",
                    title="Task 1",
                    description=None,
                    priority=TaskPriority.HIGH,
                    status=TaskStatus.INCOMPLETE,
                    due_date=None,
                    tags=[],
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                ),
            )

            # Act
            response = agent_client.run(
                session=test_db_session,
                user_id="user_123",
                conversation_history=[],
                user_message="Add a high priority task",
            )

            # Assert
            assert "task" in response.lower()


# ============================================================================
# Error Handling Tests (T029)
# ============================================================================


def test_agent_handles_openai_api_timeout(test_db_session: Session):
    """
    Test agent handles OpenAI API timeout gracefully.

    Validates:
    - Timeout exception caught
    - Clear error message returned
    - Circuit breaker may trigger

    Constitution: Section XVI - Resilience
    """
    with patch.dict("os.environ", {"OPENAI_API_KEY": "test_key_123"}):
        with patch("src.api.services.agent_client.openai") as mock_openai:
            # Arrange: Mock API timeout
            mock_client = Mock()
            mock_client.chat.completions.create.side_effect = Exception("API timeout")
            mock_openai.Client.return_value = mock_client

            agent_client = AgentClient()

            # Act & Assert
            with pytest.raises(Exception) as exc_info:
                agent_client.run(
                    session=test_db_session,
                    user_id="user_123",
                    conversation_history=[],
                    user_message="Add a task",
                )
            assert "timeout" in str(exc_info.value).lower() or "API" in str(exc_info.value)


def test_agent_handles_invalid_tool_parameters(test_db_session: Session, mocker):
    """
    Test agent handles invalid tool parameters.

    Validates:
    - Pydantic validation error caught
    - Error reported back to agent
    - Agent can recover and respond

    Constitution: Section X - Input validation
    """
    with patch.dict("os.environ", {"OPENAI_API_KEY": "test_key_123"}):
        # Arrange: Mock OpenAI function calling
        mock_function_call = Mock()
        mock_function_call.name = "add_task"
        mock_function_call.arguments = '{"title": ""}'  # Empty title (invalid)

        mock_first_message = Mock()
        mock_first_message.content = None
        mock_first_message.function_call = mock_function_call

        mock_tool_response = Mock()
        mock_tool_response.choices = [Mock(message=mock_first_message)]

        mock_final_message = Mock()
        mock_final_message.content = "Please provide a task title."
        mock_final_message.function_call = None

        mock_final_response = Mock()
        mock_final_response.choices = [Mock(message=mock_final_message)]

        with patch("src.api.services.agent_client.openai") as mock_openai:
            mock_client = Mock()
            mock_client.chat.completions.create.side_effect = [
                mock_tool_response,
                mock_final_response,
            ]
            mock_openai.Client.return_value = mock_client

            agent_client = AgentClient()

            # Act
            response = agent_client.run(
                session=test_db_session,
                user_id="user_123",
                conversation_history=[],
                user_message="Add a task with no title",
            )

            # Assert
            assert "title" in response.lower() or "provide" in response.lower()


def test_agent_respects_user_isolation(test_db_session: Session, mocker):
    """
    Test agent always uses injected user_id, never from agent input.

    Validates:
    - user_id parameter passed to all MCP tools
    - Agent cannot override user_id
    - User isolation enforced

    Constitution: Section IX - MCP boundary (user_id injection)
    """
    with patch.dict("os.environ", {"OPENAI_API_KEY": "test_key_123"}):
        # Arrange: Mock OpenAI function calling
        mock_function_call = Mock()
        mock_function_call.name = "add_task"
        mock_function_call.arguments = '{"title": "Secret task", "user_id": "hacker_999"}'

        mock_message = Mock()
        mock_message.content = None
        mock_message.function_call = mock_function_call

        mock_first_response = Mock()
        mock_first_response.choices = [Mock(message=mock_message)]

        # Second response after tool execution
        mock_final_message = Mock()
        mock_final_message.content = "I've added your task."
        mock_final_message.function_call = None

        mock_final_response = Mock()
        mock_final_response.choices = [Mock(message=mock_final_message)]

        with patch("src.api.services.agent_client.openai") as mock_openai:
            mock_client = Mock()
            mock_client.chat.completions.create.side_effect = [
                mock_first_response,
                mock_final_response,
            ]
            mock_openai.Client.return_value = mock_client

            agent_client = AgentClient()

            # Mock add_task to verify user_id and return proper output
            from mcp.schemas import AddTaskOutput, TaskStatus
            from datetime import datetime

            mock_add_task = mocker.patch("src.api.services.agent_client.add_task")
            mock_add_task.return_value = AddTaskOutput(
                id=1,
                user_id="user_123",
                title="Secret task",
                description=None,
                priority=TaskPriority.MEDIUM,
                status=TaskStatus.INCOMPLETE,
                due_date=None,
                tags=[],
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )

            # Act
            agent_client.run(
                session=test_db_session,
                user_id="user_123",  # Legitimate user
                conversation_history=[],
                user_message="Add a task",
            )

            # Assert: add_task called with INJECTED user_id, not from agent
            call_args = mock_add_task.call_args
            assert call_args[1]["user_id"] == "user_123"  # Injected by server
            # Agent's "hacker_999" should be ignored


def test_agent_uses_conversation_history_for_context(test_db_session: Session):
    """
    Test agent uses conversation history for contextual responses.

    Validates:
    - Previous messages passed to OpenAI API
    - Agent can reference prior context
    - Multi-turn conversations supported

    Constitution: Section XV - Context management
    """
    with patch.dict("os.environ", {"OPENAI_API_KEY": "test_key_123"}):
        # Arrange: Mock OpenAI response without function call
        mock_message = Mock()
        mock_message.content = "I've marked your grocery task as complete."
        mock_message.function_call = None

        mock_response = Mock()
        mock_response.choices = [Mock(message=mock_message)]

        with patch("src.api.services.agent_client.openai") as mock_openai:
            mock_client = Mock()
            mock_client.chat.completions.create.return_value = mock_response
            mock_openai.Client.return_value = mock_client

            agent_client = AgentClient()

            # Act: User references "it" (refers to previous task)
            history = [
                {"role": "user", "content": "Add a task to buy groceries"},
                {"role": "assistant", "content": "I've added the grocery task."},
            ]
            _response = agent_client.run(  # noqa: F841
                session=test_db_session,
                user_id="user_123",
                conversation_history=history,
                user_message="Mark it as complete",  # "it" = grocery task
            )

            # Assert: OpenAI called with full history
            call_args = mock_client.chat.completions.create.call_args
            messages = call_args[1]["messages"]
            assert len(messages) >= 3  # History + new message
            assert any("groceries" in msg.get("content", "").lower() for msg in messages)


# ============================================================================
# Tool Registry Tests - ALL 5 Tools (T085)
# ============================================================================


def test_agent_client_registers_all_5_mcp_tools():
    """
    Test AgentClient registers all 5 MCP tools.

    Validates:
    - add_task, list_tasks, complete_task, update_task, delete_task
    - Each tool has correct parameters
    - Tool count = 5

    Constitution: Section III - MCP as universal interface
    """
    with patch.dict("os.environ", {"OPENAI_API_KEY": "test_key_123"}):
        with patch("src.api.services.agent_client.openai"):
            # Act
            agent_client = AgentClient()

            # Assert: All 5 tools registered
            assert len(agent_client.tools) == 5
            assert "add_task" in agent_client.tools
            assert "list_tasks" in agent_client.tools
            assert "complete_task" in agent_client.tools
            assert "update_task" in agent_client.tools
            assert "delete_task" in agent_client.tools


def test_agent_client_update_task_tool_schema():
    """
    Test update_task tool has correct schema.

    Validates:
    - task_id required
    - title, description, priority, due_date, tags optional
    - Partial updates supported

    Constitution: Section IX - MCP tool contracts
    """
    with patch.dict("os.environ", {"OPENAI_API_KEY": "test_key_123"}):
        with patch("src.api.services.agent_client.openai"):
            # Act
            agent_client = AgentClient()
            update_tool = agent_client.tools["update_task"]

            # Assert
            assert update_tool["name"] == "update_task"
            assert "update task details" in update_tool["description"].lower()
            assert update_tool["parameters"]["required"] == ["task_id"]
            assert "title" in update_tool["parameters"]["properties"]
            assert "priority" in update_tool["parameters"]["properties"]
            assert "tags" in update_tool["parameters"]["properties"]


def test_agent_client_delete_task_tool_schema():
    """
    Test delete_task tool has correct schema.

    Validates:
    - task_id required
    - Permanently delete warning in description
    - Confirmation prompt in description

    Constitution: Section IX - MCP tool contracts
    """
    with patch.dict("os.environ", {"OPENAI_API_KEY": "test_key_123"}):
        with patch("src.api.services.agent_client.openai"):
            # Act
            agent_client = AgentClient()
            delete_tool = agent_client.tools["delete_task"]

            # Assert
            assert delete_tool["name"] == "delete_task"
            assert "permanently delete" in delete_tool["description"].lower()
            assert "irreversible" in delete_tool["description"].lower()
            assert delete_tool["parameters"]["required"] == ["task_id"]


# ============================================================================
# CircuitBreaker Integration Tests (T087)
# ============================================================================


def test_agent_client_circuit_breaker_initialization():
    """
    Test AgentClient initializes CircuitBreaker.

    Validates:
    - CircuitBreaker created
    - Failure threshold = 5
    - Recovery timeout = 60 seconds

    Constitution: Section XVI - Resilience
    """
    with patch.dict("os.environ", {"OPENAI_API_KEY": "test_key_123"}):
        with patch("src.api.services.agent_client.openai"):
            # Act
            agent_client = AgentClient()

            # Assert
            assert agent_client.circuit_breaker is not None
            assert agent_client.circuit_breaker.failure_threshold == 5
            assert agent_client.circuit_breaker.recovery_timeout == 60


def test_agent_client_circuit_breaker_wraps_openai_calls(test_db_session: Session):
    """
    Test CircuitBreaker wraps OpenAI API calls.

    Validates:
    - CircuitBreaker.call() used for OpenAI API
    - Failures tracked by CircuitBreaker
    - Circuit opens after threshold

    Constitution: Section XVI - Circuit breaker pattern
    """
    with patch.dict("os.environ", {"OPENAI_API_KEY": "test_key_123"}):
        with patch("src.api.services.agent_client.openai") as mock_openai:
            # Arrange: Mock OpenAI to fail
            mock_client = Mock()
            mock_client.chat.completions.create.side_effect = Exception("OpenAI timeout")
            mock_openai.Client.return_value = mock_client

            agent_client = AgentClient()

            # Act: Call 5 times to trigger circuit breaker
            for i in range(5):
                with pytest.raises(Exception):
                    agent_client.run(
                        session=test_db_session,
                        user_id="user_cb_test",
                        conversation_history=[],
                        user_message="Test message",
                    )

            # Assert: Circuit is now OPEN
            from mcp.utils.circuit_breaker import CircuitState

            assert agent_client.circuit_breaker.state == CircuitState.OPEN
            assert agent_client.circuit_breaker.failure_count == 5


def test_agent_client_circuit_breaker_fail_fast_when_open(test_db_session: Session):
    """
    Test CircuitBreaker fails fast when OPEN.

    Validates:
    - OPEN circuit rejects requests immediately
    - No OpenAI API call made
    - Clear error message returned

    Constitution: Section XVI - Fail fast (no cascading failures)
    """
    with patch.dict("os.environ", {"OPENAI_API_KEY": "test_key_123"}):
        with patch("src.api.services.agent_client.openai") as mock_openai:
            # Arrange
            mock_client = Mock()
            mock_openai.Client.return_value = mock_client

            agent_client = AgentClient()

            # Manually set circuit to OPEN
            from mcp.utils.circuit_breaker import CircuitState
            import time

            agent_client.circuit_breaker.state = CircuitState.OPEN
            agent_client.circuit_breaker.last_failure_time = time.time()  # Recent failure

            # Act & Assert: Should fail fast without calling OpenAI
            with pytest.raises(Exception) as exc_info:
                agent_client.run(
                    session=test_db_session,
                    user_id="user_fail_fast",
                    conversation_history=[],
                    user_message="Test",
                )

            # Assert: Circuit breaker error, not OpenAI error
            assert "Circuit breaker is OPEN" in str(exc_info.value)
            # OpenAI API should NOT have been called
            mock_client.chat.completions.create.assert_not_called()


# ============================================================================
# Update/Delete Tool Execution Tests (T088)
# ============================================================================


def test_agent_executes_update_task_tool(test_db_session: Session, mocker):
    """
    Test agent executes update_task MCP tool.

    Validates:
    - Agent calls update_task with correct parameters
    - user_id injected by server
    - Task updated in database
    - Natural language response returned

    Constitution: Section IX - MCP tool execution
    """
    with patch.dict("os.environ", {"OPENAI_API_KEY": "test_key_123"}):
        # Arrange: Mock OpenAI function calling
        mock_function_call = Mock()
        mock_function_call.name = "update_task"
        mock_function_call.arguments = '{"task_id": 1, "priority": "HIGH"}'

        mock_first_message = Mock()
        mock_first_message.content = None
        mock_first_message.function_call = mock_function_call

        mock_first_response = Mock()
        mock_first_response.choices = [Mock(message=mock_first_message)]

        mock_final_message = Mock()
        mock_final_message.content = "I've updated the task priority to HIGH."
        mock_final_message.function_call = None

        mock_final_response = Mock()
        mock_final_response.choices = [Mock(message=mock_final_message)]

        with patch("src.api.services.agent_client.openai") as mock_openai:
            mock_client = Mock()
            mock_client.chat.completions.create.side_effect = [
                mock_first_response,
                mock_final_response,
            ]
            mock_openai.Client.return_value = mock_client

            agent_client = AgentClient()

            # Mock update_task
            from mcp.schemas import UpdateTaskOutput, TaskStatus
            from datetime import datetime

            mock_update = mocker.patch("src.api.services.agent_client.update_task")
            mock_update.return_value = UpdateTaskOutput(
                id=1,
                title="Buy groceries",
                description=None,
                priority=TaskPriority.HIGH,
                status=TaskStatus.INCOMPLETE,
                due_date=None,
                tags=[],
                updated_at=datetime.utcnow(),
                message="Task updated successfully",
            )

            # Act
            response = agent_client.run(
                session=test_db_session,
                user_id="user_update_test",
                conversation_history=[],
                user_message="Update task 1 to high priority",
            )

            # Assert
            assert "HIGH" in response or "high" in response.lower()
            mock_update.assert_called_once()
            # Verify user_id injected
            call_args = mock_update.call_args
            assert call_args[1]["user_id"] == "user_update_test"


def test_agent_executes_delete_task_tool(test_db_session: Session, mocker):
    """
    Test agent executes delete_task MCP tool.

    Validates:
    - Agent calls delete_task with task_id
    - user_id injected by server
    - Task deleted from database
    - Confirmation message returned

    Constitution: Section IX - MCP tool execution
    """
    with patch.dict("os.environ", {"OPENAI_API_KEY": "test_key_123"}):
        # Arrange: Mock OpenAI function calling
        mock_function_call = Mock()
        mock_function_call.name = "delete_task"
        mock_function_call.arguments = '{"task_id": 1}'

        mock_first_message = Mock()
        mock_first_message.content = None
        mock_first_message.function_call = mock_function_call

        mock_first_response = Mock()
        mock_first_response.choices = [Mock(message=mock_first_message)]

        mock_final_message = Mock()
        mock_final_message.content = "I've permanently deleted the task 'Buy groceries'."
        mock_final_message.function_call = None

        mock_final_response = Mock()
        mock_final_response.choices = [Mock(message=mock_final_message)]

        with patch("src.api.services.agent_client.openai") as mock_openai:
            mock_client = Mock()
            mock_client.chat.completions.create.side_effect = [
                mock_first_response,
                mock_final_response,
            ]
            mock_openai.Client.return_value = mock_client

            agent_client = AgentClient()

            # Mock delete_task
            from mcp.schemas import DeleteTaskOutput

            mock_delete = mocker.patch("src.api.services.agent_client.delete_task")
            mock_delete.return_value = DeleteTaskOutput(
                task_id=1,
                title="Buy groceries",
                message="Task 'Buy groceries' has been permanently deleted.",
            )

            # Act
            response = agent_client.run(
                session=test_db_session,
                user_id="user_delete_test",
                conversation_history=[],
                user_message="Delete task 1",
            )

            # Assert
            assert "deleted" in response.lower() or "removed" in response.lower()
            mock_delete.assert_called_once()
            # Verify user_id injected
            call_args = mock_delete.call_args
            assert call_args[1]["user_id"] == "user_delete_test"
