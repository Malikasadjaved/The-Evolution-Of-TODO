"""Manual testing script for persistent storage verification (T054-T056)."""

from datetime import datetime, timedelta
from src.todo.models import Priority, RecurrencePattern
from src.todo import storage, persistence

def test_persistence_scenario():
    """Simulate T054: Create tasks → verify persistence → reload → verify."""

    print("=" * 60)
    print("MANUAL TEST: Persistent Storage Verification")
    print("=" * 60)

    # Acquire lock
    lock = persistence.acquire_lock()

    try:
        # Load existing tasks
        loaded_tasks = persistence.load_tasks()
        storage.tasks = loaded_tasks
        storage.task_index = {task.id: idx for idx, task in enumerate(loaded_tasks)}
        if loaded_tasks:
            storage.next_task_id = max(task.id for task in loaded_tasks) + 1
        else:
            storage.next_task_id = 1

        print(f"\nInitial state: {len(storage.tasks)} tasks loaded")
        print(f"Storage location: {persistence.TASKS_FILE}")

        # Create 3 test tasks
        print("\n--- Creating 3 Test Tasks ---")

        task1 = storage.create_task(
            title="Test Task 1: Buy groceries",
            description="Milk, eggs, bread",
            priority=Priority.HIGH,
            tags=["Home", "Shopping"]
        )
        print(f"[OK] Created task {task1.id}: {task1.title}")

        task2 = storage.create_task(
            title="Test Task 2: Finish project report",
            description="Due next week",
            priority=Priority.MEDIUM,
            tags=["Work"],
            due_date=datetime.now() + timedelta(days=7)
        )
        print(f"[OK] Created task {task2.id}: {task2.title}")

        task3 = storage.create_task(
            title="Test Task 3: Weekly team meeting",
            description="Every Monday at 10am",
            priority=Priority.LOW,
            tags=["Work"],
            due_date=datetime.now() + timedelta(days=1),
            recurrence=RecurrencePattern.WEEKLY
        )
        print(f"[OK] Created task {task3.id}: {task3.title}")

        print(f"\nTotal tasks in memory: {len(storage.tasks)}")

        # Verify auto-save worked
        print("\n--- Verifying Auto-Save ---")
        fresh_load = persistence.load_tasks()
        print(f"[OK] File contains {len(fresh_load)} tasks")

        if len(fresh_load) == len(storage.tasks):
            print("[OK] Auto-save working correctly")
        else:
            print(f"[FAIL] Mismatch: memory has {len(storage.tasks)}, file has {len(fresh_load)}")

        # Display all tasks
        print("\n--- Current Tasks ---")
        for task in storage.get_all_tasks():
            print(f"  [{task.id}] {task.title}")
            print(f"      Priority: {task.priority.value}, Status: {task.status}")
            print(f"      Tags: {', '.join(task.tags)}")
            if task.due_date:
                print(f"      Due: {task.due_date.strftime('%Y-%m-%d %H:%M')}")
            if task.recurrence:
                print(f"      Recurrence: {task.recurrence.value}")

        # Test update operation
        print("\n--- Testing Update Operation ---")
        storage.update_task(task1.id, status="complete")
        print(f"[OK] Marked task {task1.id} as complete")

        # Test persistence after update
        updated_load = persistence.load_tasks()
        updated_task = next((t for t in updated_load if t.id == task1.id), None)
        if updated_task and updated_task.status == "complete":
            print("[OK] Update persisted correctly")
        else:
            print("[FAIL] Update not persisted")

        # Test delete operation
        print("\n--- Testing Delete Operation ---")
        storage.delete_task(task3.id)
        print(f"[OK] Deleted task {task3.id}")

        # Verify deletion persisted
        delete_load = persistence.load_tasks()
        if len(delete_load) == len(storage.tasks):
            print(f"[OK] Delete persisted correctly ({len(delete_load)} tasks remain)")
        else:
            print(f"[FAIL] Delete not persisted")

        print("\n--- Final State ---")
        print(f"Tasks in memory: {len(storage.tasks)}")
        print(f"Tasks in file: {len(persistence.load_tasks())}")

        # Verify backup file exists
        if persistence.BACKUP_FILE.exists():
            print(f"[OK] Backup file exists: {persistence.BACKUP_FILE}")
        else:
            print("[OK] No backup yet (normal for first few saves)")

        print("\n" + "=" * 60)
        print("MANUAL TEST COMPLETE")
        print("=" * 60)
        print("\nTo verify persistence across sessions:")
        print("1. Run this script again")
        print("2. Expected result: Should load the tasks created above")
        print(f"3. Check file: {persistence.TASKS_FILE}")

    finally:
        # Release lock
        persistence.release_lock(lock)


if __name__ == "__main__":
    test_persistence_scenario()
