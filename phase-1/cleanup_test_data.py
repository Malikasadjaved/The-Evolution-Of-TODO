"""Cleanup test data from manual verification."""

from src.todo import persistence, storage

def cleanup():
    """Clear all test tasks."""
    lock = persistence.acquire_lock()
    try:
        # Clear in-memory storage
        storage.tasks.clear()
        storage.task_index.clear()
        storage.next_task_id = 1

        # Save empty state
        persistence.save_tasks([])

        print("Test data cleaned up successfully")
        print(f"Storage location: {persistence.TASKS_FILE}")
    finally:
        persistence.release_lock(lock)

if __name__ == "__main__":
    cleanup()
