# mypy: ignore-errors
"""
AgentClient - OpenAI Agents SDK integration with MCP tools.

This client wraps the OpenAI Agents SDK and registers MCP tools
as agent functions. The agent understands natural language and
decides which tools to call with what parameters.

Constitution: .specify/memory/phase-3-constitution.md (v1.1.0)
Spec: specs/002-ai-chatbot-mcp/spec.md Section 5.2

Key Responsibilities:
1. Initialize OpenAI Agent with GPT-4
2. Register MCP tools (add_task, list_tasks, etc.) as agent functions
3. Accept conversation history for multi-turn context
4. Execute agent.run() with user message
5. Handle tool calls requested by agent
6. Return final natural language response

Critical Security:
- user_id is INJECTED by server, NEVER from agent parameters
- All MCP tool calls enforce user isolation
- Tool parameters validated by Pydantic schemas

Implementation: Task T030 (Phase 3: User Story 1)
"""

import json
import os
from datetime import datetime
from typing import Any, Dict, List

import openai
from sqlmodel import Session

from mcp.schemas import (
    AddTaskInput,
    CompleteTaskInput,
    DeleteTaskInput,
    ListTasksInput,
    TaskPriority,
    TaskStatus,
    UpdateTaskInput,
)
from mcp.tools.add_task import add_task
from mcp.tools.complete_task import complete_task
from mcp.tools.delete_task import delete_task
from mcp.tools.list_tasks import list_tasks
from mcp.tools.update_task import update_task
from mcp.utils.circuit_breaker import CircuitBreaker
from mcp.utils.logger import StructuredLogger
from src.api.config import settings

logger = StructuredLogger(service_name="agent-client")


class AgentClient:
    """
    OpenAI Agent client with MCP tool registration.

    This class initializes an OpenAI Agent (GPT-4) and registers
    MCP tools as function calls. The agent can understand natural
    language and decide which tools to execute.

    Usage:
        agent = AgentClient()
        response = agent.run(
            session=db_session,
            user_id="user_123",
            conversation_history=[...],
            user_message="Add a task to buy groceries"
        )
    """

    def __init__(self):
        """
        Initialize AgentClient with OpenAI API key and tool registry.

        Raises:
            ValueError: If OPENAI_API_KEY environment variable not set
        """
        # Load OpenAI API key from settings (loaded from .env)
        api_key = settings.openai_api_key
        if not api_key:
            raise ValueError(
                "OPENAI_API_KEY environment variable not set. "
                "Please add it to your .env file."
            )

        # Initialize OpenAI client
        self.client = openai.Client(api_key=api_key)

        # Initialize CircuitBreaker for OpenAI API protection
        # Failure threshold: 5 consecutive failures
        # Recovery timeout: 60 seconds (1 minute)
        self.circuit_breaker = CircuitBreaker(failure_threshold=5, recovery_timeout=60)

        # Register MCP tools
        self.tools = self._register_tools()

        logger.info(
            event="agent_client_initialized",
            message=f"AgentClient initialized with {len(self.tools)} tools and CircuitBreaker",
            tool_count=len(self.tools),
            circuit_breaker_threshold=5,
            circuit_breaker_timeout=60,
        )

    def _register_tools(self) -> Dict[str, Dict]:
        """
        Register MCP tools as OpenAI function definitions.

        Returns:
            Dictionary mapping tool names to OpenAI function specs

        Note: This follows OpenAI's function calling format.
        See: https://platform.openai.com/docs/guides/function-calling
        """
        return {
            "add_task": {
                "name": "add_task",
                "description": (
                    "Create a new task for the user. "
                    "Extract title, priority (LOW/MEDIUM/HIGH), due date, "
                    "and tags from the user's message."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "title": {
                            "type": "string",
                            "description": "Task title (required, 1-500 characters)",
                        },
                        "description": {
                            "type": "string",
                            "description": "Task description (optional, max 2000 characters)",
                        },
                        "priority": {
                            "type": "string",
                            "enum": ["LOW", "MEDIUM", "HIGH"],
                            "description": "Task priority (default: MEDIUM)",
                        },
                        "due_date": {
                            "type": "string",
                            "description": "Due date in ISO 8601 format (e.g., 2025-12-31T17:00:00)",
                        },
                        "tags": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "List of tags (e.g., ['Work', 'Urgent'])",
                        },
                    },
                    "required": ["title"],
                },
            },
            "list_tasks": {
                "name": "list_tasks",
                "description": (
                    "List and filter the user's tasks. "
                    "Can filter by status (INCOMPLETE/COMPLETE), priority (LOW/MEDIUM/HIGH), or tag name. "
                    "Returns tasks ordered by newest first."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "status": {
                            "type": "string",
                            "enum": ["INCOMPLETE", "COMPLETE"],
                            "description": "Filter by completion status (optional)",
                        },
                        "priority": {
                            "type": "string",
                            "enum": ["LOW", "MEDIUM", "HIGH"],
                            "description": "Filter by priority level (optional)",
                        },
                        "tag": {
                            "type": "string",
                            "description": "Filter by tag name (optional)",
                        },
                        "limit": {
                            "type": "integer",
                            "description": "Maximum number of tasks to return (default 50, max 100)",
                            "minimum": 1,
                            "maximum": 100,
                        },
                    },
                    "required": [],  # All parameters optional
                },
            },
            "complete_task": {
                "name": "complete_task",
                "description": (
                    "Mark a task as complete. "
                    "Use this when the user says they finished a task or want to mark it done."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "task_id": {
                            "type": "integer",
                            "description": "ID of the task to mark as complete (required)",
                        }
                    },
                    "required": ["task_id"],
                },
            },
            "update_task": {
                "name": "update_task",
                "description": (
                    "Update task details such as title, description, priority, due date, or tags. "
                    "Only provide the fields that need to be changed. Other fields will remain unchanged. "
                    "Use this when the user wants to modify an existing task."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "task_id": {
                            "type": "integer",
                            "description": "ID of the task to update (required)",
                        },
                        "title": {
                            "type": "string",
                            "description": "New task title (optional, 1-500 characters)",
                        },
                        "description": {
                            "type": "string",
                            "description": "New task description (optional, max 2000 characters)",
                        },
                        "priority": {
                            "type": "string",
                            "enum": ["LOW", "MEDIUM", "HIGH"],
                            "description": "New priority level (optional)",
                        },
                        "due_date": {
                            "type": "string",
                            "description": "New due date in ISO 8601 format (optional). Set to null to remove due date.",
                        },
                        "tags": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "New list of tags (optional). Replaces existing tags. Empty array removes all tags.",
                        },
                    },
                    "required": ["task_id"],
                },
            },
            "delete_task": {
                "name": "delete_task",
                "description": (
                    "Permanently delete a task. This action is irreversible. "
                    "Use this when the user explicitly asks to delete or remove a task. "
                    "Always confirm with the user before calling this function."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "task_id": {
                            "type": "integer",
                            "description": "ID of the task to delete (required)",
                        }
                    },
                    "required": ["task_id"],
                },
            },
        }

    def run(
        self,
        session: Session,
        user_id: str,
        conversation_history: List[Dict[str, str]],
        user_message: str,
    ) -> str:
        """
        Run agent with user message and conversation context.

        Flow:
        1. Format conversation history for OpenAI
        2. Call OpenAI Chat Completions API with tools
        3. If agent requests tool calls, execute them
        4. Send tool results back to agent
        5. Return final assistant response

        Args:
            session: Database session for MCP tool execution
            user_id: User identifier (injected by server for isolation)
            conversation_history: Previous messages [{"role": "user|assistant", "content": str}]
            user_message: Current user message

        Returns:
            Final assistant response (natural language)

        Raises:
            Exception: If OpenAI API fails or tool execution fails
        """
        logger.info(
            event="agent_run_started",
            message="Running agent with user message",
            user_id=user_id,
            message_length=len(user_message),
            history_length=len(conversation_history),
        )

        try:
            # Step 1: Build messages for OpenAI with system prompt including current date
            current_datetime = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            system_message = {
                "role": "system",
                "content": f"Current date and time: {current_datetime}"
            }

            messages = [system_message]
            messages.extend(self._format_history(conversation_history))
            messages.append({"role": "user", "content": user_message})

            # Step 2: Prepare OpenAI function definitions
            functions = [tool for tool in self.tools.values()]

            # Step 3: Call OpenAI Chat Completions API with CircuitBreaker
            response = self.circuit_breaker.call(
                self.client.chat.completions.create,
                model="gpt-4-1106-preview",  # GPT-4 Turbo with function calling
                messages=messages,
                functions=functions,
                function_call="auto",  # Let agent decide when to call functions
                temperature=0.7,
                max_tokens=1000,
            )

            # Step 4: Handle response
            message = response.choices[0].message

            # Check if agent wants to call a function
            if message.function_call:
                # Execute the requested function
                function_name = message.function_call.name
                function_args = json.loads(message.function_call.arguments)

                logger.info(
                    event="agent_tool_call",
                    message=f"Agent requested tool: {function_name}",
                    user_id=user_id,
                    tool_name=function_name,
                    tool_args=function_args,
                )

                # Execute MCP tool
                tool_result = self._execute_tool(
                    session=session,
                    user_id=user_id,
                    function_name=function_name,
                    function_args=function_args,
                )

                # Send tool result back to agent for final response
                messages.append(
                    {
                        "role": "assistant",
                        "content": None,
                        "function_call": {
                            "name": function_name,
                            "arguments": message.function_call.arguments,
                        },
                    }
                )
                messages.append(
                    {
                        "role": "function",
                        "name": function_name,
                        "content": json.dumps(tool_result),
                    }
                )

                # Get final response from agent with CircuitBreaker
                final_response = self.circuit_breaker.call(
                    self.client.chat.completions.create,
                    model="gpt-4-1106-preview",
                    messages=messages,
                    temperature=0.7,
                    max_tokens=1000,
                )

                final_message = final_response.choices[0].message.content

                logger.info(
                    event="agent_run_completed",
                    message="Agent completed with tool execution",
                    user_id=user_id,
                    tool_used=function_name,
                    response_length=len(final_message),
                )

                return final_message

            else:
                # No function call, return direct response
                assistant_response = message.content

                logger.info(
                    event="agent_run_completed",
                    message="Agent completed without tool execution",
                    user_id=user_id,
                    response_length=len(assistant_response),
                )

                return assistant_response

        except Exception as e:
            logger.error(
                event="agent_run_failed",
                message="Agent execution failed",
                user_id=user_id,
                error=str(e),
                error_type=type(e).__name__,
            )
            raise

    def _format_history(self, history: List[Dict[str, str]]) -> List[Dict[str, str]]:
        """
        Format conversation history for OpenAI API.

        Args:
            history: Conversation history from ConversationManager

        Returns:
            Formatted messages for OpenAI API
        """
        return [{"role": msg["role"], "content": msg["content"]} for msg in history]

    def _execute_tool(
        self,
        session: Session,
        user_id: str,
        function_name: str,
        function_args: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Execute MCP tool requested by agent.

        CRITICAL: user_id is INJECTED here, NOT from function_args.
        This enforces user isolation at the MCP boundary.

        Args:
            session: Database session
            user_id: User identifier (injected by server)
            function_name: Name of tool to execute
            function_args: Tool parameters from agent

        Returns:
            Tool execution result (serializable dict)

        Raises:
            Exception: If tool execution fails
        """
        try:
            if function_name == "add_task":
                # Parse and validate input
                task_input = AddTaskInput(
                    title=function_args.get("title"),
                    description=function_args.get("description"),
                    priority=TaskPriority(function_args.get("priority", "MEDIUM")),
                    due_date=function_args.get("due_date"),
                    tags=function_args.get("tags"),
                )

                # Execute tool with INJECTED user_id
                result = add_task(
                    session=session,
                    user_id=user_id,  # CRITICAL: Injected by server
                    task_input=task_input,
                )

                # Convert to serializable dict
                return {
                    "success": True,
                    "task_id": result.id,
                    "title": result.title,
                    "priority": result.priority.value,
                    "status": result.status.value,
                    "tags": result.tags,
                }

            elif function_name == "list_tasks":
                # Parse and validate input
                task_input = ListTasksInput(
                    status=(
                        TaskStatus(function_args["status"])
                        if function_args.get("status")
                        else None
                    ),
                    priority=(
                        TaskPriority(function_args["priority"])
                        if function_args.get("priority")
                        else None
                    ),
                    tag=function_args.get("tag"),
                    limit=function_args.get("limit", 50),
                )

                # Execute tool with INJECTED user_id
                result = list_tasks(
                    session=session,
                    user_id=user_id,  # CRITICAL: Injected by server
                    task_input=task_input,
                )

                # Convert to serializable dict
                tasks_data = [
                    {
                        "id": task.id,
                        "title": task.title,
                        "description": task.description,
                        "priority": task.priority.value,
                        "status": task.status.value,
                        "due_date": task.due_date.isoformat()
                        if task.due_date
                        else None,
                        "tags": task.tags,
                        "created_at": task.created_at.isoformat(),
                    }
                    for task in result.tasks
                ]

                return {"success": True, "tasks": tasks_data, "count": result.count}

            elif function_name == "complete_task":
                # Parse and validate input
                task_input = CompleteTaskInput(task_id=function_args["task_id"])

                # Execute tool with INJECTED user_id
                result = complete_task(
                    session=session,
                    user_id=user_id,  # CRITICAL: Injected by server
                    task_input=task_input,
                )

                # Convert to serializable dict
                return {
                    "success": True,
                    "task_id": result.id,
                    "title": result.title,
                    "status": result.status.value,
                    "completed_at": (
                        result.completed_at.isoformat() if result.completed_at else None
                    ),
                    "message": result.message,
                }

            elif function_name == "update_task":
                # Parse and validate input
                task_input = UpdateTaskInput(
                    task_id=function_args["task_id"],
                    title=function_args.get("title"),
                    description=function_args.get("description"),
                    priority=(
                        TaskPriority(function_args["priority"])
                        if function_args.get("priority")
                        else None
                    ),
                    due_date=function_args.get("due_date"),
                    tags=function_args.get("tags"),
                )

                # Execute tool with INJECTED user_id
                result = update_task(
                    session=session,
                    user_id=user_id,  # CRITICAL: Injected by server
                    task_input=task_input,
                )

                # Convert to serializable dict
                return {
                    "success": True,
                    "task_id": result.id,
                    "title": result.title,
                    "description": result.description,
                    "priority": result.priority.value,
                    "status": result.status.value,
                    "due_date": result.due_date.isoformat()
                    if result.due_date
                    else None,
                    "tags": result.tags,
                    "updated_at": result.updated_at.isoformat(),
                    "message": result.message,
                }

            elif function_name == "delete_task":
                # Parse and validate input
                task_input = DeleteTaskInput(task_id=function_args["task_id"])

                # Execute tool with INJECTED user_id
                result = delete_task(
                    session=session,
                    user_id=user_id,  # CRITICAL: Injected by server
                    task_input=task_input,
                )

                # Convert to serializable dict
                return {
                    "success": True,
                    "task_id": result.task_id,
                    "title": result.title,
                    "message": result.message,
                }

            else:
                # Tool not implemented yet
                logger.warning(
                    event="tool_not_implemented",
                    message=f"Tool not implemented: {function_name}",
                    user_id=user_id,
                    tool_name=function_name,
                )
                return {
                    "success": False,
                    "error": f"Tool '{function_name}' not yet implemented",
                }

        except Exception as e:
            logger.error(
                event="tool_execution_failed",
                message=f"Tool execution failed: {function_name}",
                user_id=user_id,
                tool_name=function_name,
                error=str(e),
                error_type=type(e).__name__,
            )
            return {"success": False, "error": str(e)}
