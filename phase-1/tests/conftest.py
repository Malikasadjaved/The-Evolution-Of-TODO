"""Shared pytest fixtures for todo application tests."""

import pytest


@pytest.fixture
def clear_storage():
    """Clear storage before and after each test to ensure isolation."""
    # Import here to avoid circular imports
    import src.todo.storage as storage

    # Clear before test
    storage.tasks = []
    storage.task_index = {}
    storage.next_task_id = 1

    yield

    # Clear after test
    storage.tasks = []
    storage.task_index = {}
    storage.next_task_id = 1
