"""Entry point for Todo Application."""

from src.todo.cli import run_cli
from src.todo import persistence, storage


def main():
    """Main entry point with persistent storage."""
    # T047: Acquire file lock at startup
    lock = persistence.acquire_lock()

    try:
        # T048: Load existing tasks from storage
        loaded_tasks = persistence.load_tasks()

        # T049-T051: Populate in-memory storage
        storage.tasks = loaded_tasks
        storage.task_index = {task.id: idx for idx, task in enumerate(loaded_tasks)}
        if loaded_tasks:
            storage.next_task_id = max(task.id for task in loaded_tasks) + 1
        else:
            storage.next_task_id = 1

        print(f"Loaded {len(loaded_tasks)} tasks from storage")
        print(f"Storage location: {persistence.TASKS_FILE}")
        print()

        # Run CLI
        run_cli()
    except KeyboardInterrupt:
        print("\n\nApplication interrupted by user. Goodbye!\n")
    except Exception as e:
        print(f"\n\nUnexpected error: {e}\n")
        raise
    finally:
        # T052: Release lock on exit
        persistence.release_lock(lock)


if __name__ == "__main__":
    main()
