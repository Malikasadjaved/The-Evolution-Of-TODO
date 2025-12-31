"""
MCP Tool Input/Output Schemas

This module defines Pydantic models for MCP tool inputs and outputs.
All schemas follow the Model Context Protocol specification.

Constitution: .specify/memory/phase-3-constitution.md (v1.1.0)
Spec: specs/002-ai-chatbot-mcp/spec.md Section 5.1 (MCP Tools)

Schema Design:
- Input schemas: Validate parameters from OpenAI Agents SDK
- Output schemas: Standardized responses with success/error states
- All schemas enforce user_id for isolation (injected by server, not from agent)

Implementation: Task T014 (Phase 2: Foundational)
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ============================================================================
# Enums (Match Phase 2 models)
# ============================================================================


class TaskPriority(str, Enum):
    """Task priority levels."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class TaskStatus(str, Enum):
    """Task completion status."""

    INCOMPLETE = "INCOMPLETE"
    COMPLETE = "COMPLETE"


# ============================================================================
# Tool 1: add_task (User Story 1)
# ============================================================================


class AddTaskInput(BaseModel):
    """
    Input schema for add_task MCP tool.

    Note: user_id is injected by server from JWT token, NOT from agent.
    """

    title: str = Field(..., min_length=1, max_length=500, description="Task title")
    description: Optional[str] = Field(None, max_length=2000, description="Task description")
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM, description="Task priority")
    due_date: Optional[datetime] = Field(None, description="Due date (ISO 8601 format)")
    tags: Optional[List[str]] = Field(default=None, description="List of tags")


class AddTaskOutput(BaseModel):
    """Output schema for add_task MCP tool."""

    id: int = Field(..., description="Created task ID")
    user_id: str = Field(..., description="Owner user ID")
    title: str
    description: Optional[str]
    priority: TaskPriority
    status: TaskStatus
    due_date: Optional[datetime]
    tags: List[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


# ============================================================================
# Tool 2: list_tasks (User Story 2)
# ============================================================================


class ListTasksInput(BaseModel):
    """
    Input schema for list_tasks MCP tool.

    All filters are optional. Returns all tasks if no filters provided.
    Note: user_id is injected by server, NOT from agent.
    """

    status: Optional[TaskStatus] = Field(None, description="Filter by completion status")
    priority: Optional[TaskPriority] = Field(None, description="Filter by priority level")
    tag: Optional[str] = Field(None, description="Filter by tag name")
    limit: int = Field(default=50, ge=1, le=100, description="Maximum number of tasks to return")


class TaskSummary(BaseModel):
    """Simplified task representation for list results."""

    id: int
    title: str
    description: Optional[str]
    priority: TaskPriority
    status: TaskStatus
    due_date: Optional[datetime]
    tags: List[str]
    created_at: datetime


class ListTasksOutput(BaseModel):
    """Output schema for list_tasks MCP tool."""

    tasks: List[TaskSummary] = Field(default_factory=list)
    count: int = Field(..., description="Number of tasks returned")


# ============================================================================
# Tool 3: complete_task (User Story 3)
# ============================================================================


class CompleteTaskInput(BaseModel):
    """
    Input schema for complete_task MCP tool.

    Note: user_id is injected by server, NOT from agent.
    """

    task_id: int = Field(..., description="ID of task to mark complete")


class CompleteTaskOutput(BaseModel):
    """Output schema for complete_task MCP tool."""

    id: int
    title: str
    status: TaskStatus
    completed_at: Optional[datetime]
    message: str = Field(..., description="Success message")


# ============================================================================
# Tool 4: update_task (User Story 4)
# ============================================================================


class UpdateTaskInput(BaseModel):
    """
    Input schema for update_task MCP tool.

    All fields optional except task_id. Only provided fields are updated.
    Note: user_id is injected by server, NOT from agent.
    """

    task_id: int = Field(..., description="ID of task to update")
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = Field(None, max_length=2000)
    priority: Optional[TaskPriority] = None
    due_date: Optional[datetime] = None
    tags: Optional[List[str]] = None


class UpdateTaskOutput(BaseModel):
    """Output schema for update_task MCP tool."""

    id: int
    title: str
    description: Optional[str]
    priority: TaskPriority
    status: TaskStatus
    due_date: Optional[datetime]
    tags: List[str]
    updated_at: datetime
    message: str = Field(..., description="Summary of changes made")


# ============================================================================
# Tool 5: delete_task (User Story 5)
# ============================================================================


class DeleteTaskInput(BaseModel):
    """
    Input schema for delete_task MCP tool.

    Note: user_id is injected by server, NOT from agent.
    """

    task_id: int = Field(..., description="ID of task to delete")


class DeleteTaskOutput(BaseModel):
    """Output schema for delete_task MCP tool."""

    task_id: int
    title: str = Field(..., description="Title of deleted task")
    message: str = Field(..., description="Confirmation message")
