"""
MCP Tools Package

This package contains the 5 MCP tools that enable natural language task management:
1. add_task - Create tasks from natural language (User Story 1)
2. list_tasks - Query and filter tasks (User Story 2)
3. complete_task - Mark tasks as done (User Story 3)
4. update_task - Modify task properties (User Story 4)
5. delete_task - Remove tasks (User Story 5)

Each tool:
- Validates input using schemas from mcp/schemas.py
- Enforces user isolation (user_id injected by server)
- Operates on shared database models (backend/src/models/)
- Returns structured output for agent consumption

Constitution: .specify/memory/phase-3-constitution.md (v1.1.0)
Spec: specs/002-ai-chatbot-mcp/spec.md Section 5.1
"""

from mcp.tools.add_task import add_task
from mcp.tools.list_tasks import list_tasks
from mcp.tools.complete_task import complete_task
from mcp.tools.update_task import update_task
from mcp.tools.delete_task import delete_task

__all__ = ["add_task", "list_tasks", "complete_task", "update_task", "delete_task"]
