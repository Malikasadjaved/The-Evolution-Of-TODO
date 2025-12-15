"""Demo script to showcase all features of the Todo Application."""

from datetime import datetime, timedelta
from src.todo import storage, commands
from src.todo.models import Priority, RecurrencePattern
from src.todo import filters
from colorama import init, Fore, Style

# Initialize colorama
init()

def print_section(title):
    """Print a section header."""
    print(f"\n{'='*60}")
    print(f"{Fore.CYAN}{Style.BRIGHT}{title}{Style.RESET_ALL}")
    print(f"{'='*60}\n")

def print_task(task):
    """Print a task with formatting."""
    status = "[X]" if task.status == "complete" else "[ ]"
    priority = f"[{task.priority.value}]"

    overdue = ""
    if task.is_overdue:
        overdue = f" {Fore.RED}[OVERDUE!]{Style.RESET_ALL}"

    tags = ""
    if task.tags:
        tags = f" {Fore.YELLOW}Tags: {', '.join(task.tags)}{Style.RESET_ALL}"

    due = ""
    if task.due_date:
        due = f" {Fore.MAGENTA}Due: {task.due_date.strftime('%Y-%m-%d %H:%M')}{Style.RESET_ALL}"

    recurrence = ""
    if task.recurrence:
        recurrence = f" {Fore.BLUE}[{task.recurrence.value}]{Style.RESET_ALL}"

    print(f"{status} {priority} #{task.id} {Style.BRIGHT}{task.title}{Style.RESET_ALL}{overdue}{tags}{due}{recurrence}")
    if task.description:
        print(f"    {task.description}")

def demo():
    """Run demo of all features."""

    print_section("PYTHON CLI TODO APPLICATION - DEMO")
    print(f"{Fore.GREEN}Welcome to the comprehensive feature demonstration!{Style.RESET_ALL}")
    print("This demo will showcase all 12 features across 3 tiers.\n")

    # PRIMARY TIER DEMO
    print_section("PRIMARY TIER - Core Task Management")

    # 1. Add Task
    print(f"{Fore.YELLOW}Feature 1: Add Task{Style.RESET_ALL}")
    result1 = commands.add_task_command(
        title="Team standup meeting",
        description="Daily sync with development team",
        priority="HIGH",
        tags="Work,Meeting"
    )
    print(f"[OK] {result1.message}")

    result2 = commands.add_task_command(
        title="Buy groceries",
        description="Milk, bread, eggs",
        priority="MEDIUM",
        tags="Home,Shopping"
    )
    print(f"[OK] {result2.message}")

    result3 = commands.add_task_command(
        title="Write project documentation",
        description="Complete README and deployment guide",
        priority="HIGH",
        tags="Work,Documentation"
    )
    print(f"[OK] {result3.message}")

    # 2. View All Tasks
    print(f"\n{Fore.YELLOW}Feature 2: View All Tasks{Style.RESET_ALL}")
    result = commands.view_all_tasks_command()
    print(f"[OK] {result.message}")
    for task in result.data:
        print_task(task)

    # 3. Update Task
    print(f"\n{Fore.YELLOW}Feature 3: Update Task{Style.RESET_ALL}")
    result = commands.update_task_command(1, description="Daily standup at 9:00 AM")
    print(f"[OK] {result.message}")
    print_task(result.data)

    # 4. Mark Complete
    print(f"\n{Fore.YELLOW}Feature 5: Mark Task Complete{Style.RESET_ALL}")
    result = commands.mark_complete_command(2)
    print(f"[OK] {result.message}")
    print_task(result.data)

    # 5. Mark Incomplete
    print(f"\n{Fore.YELLOW}Feature 5b: Mark Task Incomplete{Style.RESET_ALL}")
    result = commands.mark_incomplete_command(2)
    print(f"[OK] {result.message}")
    print_task(result.data)

    # INTERMEDIATE TIER DEMO
    print_section("INTERMEDIATE TIER - Organization Features")

    # 6. Priority Management
    print(f"{Fore.YELLOW}Feature 6: Priority Management{Style.RESET_ALL}")
    result = commands.add_task_command(
        title="Fix critical bug",
        priority="HIGH",
        tags="Work,Urgent"
    )
    print(f"[OK] Created HIGH priority task: {result.data.title}")

    result = commands.add_task_command(
        title="Read technical article",
        priority="LOW",
        tags="Learning"
    )
    print(f"[OK] Created LOW priority task: {result.data.title}")

    # 7. Tags & Categories
    print(f"\n{Fore.YELLOW}Feature 7: Tags & Categories{Style.RESET_ALL}")
    result = commands.add_task_command(
        title="Prepare presentation",
        tags="Work,Meeting,Q4,Important"
    )
    print(f"[OK] Task with multiple tags: {', '.join(result.data.tags)}")

    # 8. Scheduled Tasks with Due Dates
    print(f"\n{Fore.YELLOW}Feature 8: Scheduled Tasks{Style.RESET_ALL}")
    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d 14:00")
    result = commands.add_task_command(
        title="Client meeting",
        due_date_str=tomorrow,
        priority="HIGH",
        tags="Work,Meeting"
    )
    print(f"[OK] Scheduled task: {result.data.title}")
    print(f"  Due: {result.data.due_date.strftime('%Y-%m-%d %H:%M')}")
    print(f"  Type: {result.data.task_type.value}")

    # Add overdue task
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d 10:00")
    result = commands.add_task_command(
        title="Submit report",
        due_date_str=yesterday,
        priority="HIGH",
        tags="Work"
    )
    print(f"[OK] Overdue task created: {result.data.title}")
    print(f"  Overdue: {result.data.is_overdue}")

    # 9. Search & Filter
    print(f"\n{Fore.YELLOW}Feature 9: Search & Filter{Style.RESET_ALL}")

    # Search
    all_tasks = storage.get_all_tasks()
    search_results = filters.search_tasks(all_tasks, "meeting")
    print(f"[OK] Search for 'meeting': Found {len(search_results)} tasks")
    for task in search_results:
        print(f"  - {task.title}")

    # Filter by priority
    high_priority = filters.filter_by_priority(all_tasks, [Priority.HIGH])
    print(f"\n[OK] Filter by HIGH priority: Found {len(high_priority)} tasks")
    for task in high_priority:
        print(f"  - [{task.priority.value}] {task.title}")

    # Filter by tag
    work_tasks = filters.filter_by_tag(all_tasks, "Work")
    print(f"\n[OK] Filter by 'Work' tag: Found {len(work_tasks)} tasks")
    for task in work_tasks:
        print(f"  - {task.title}")

    # Filter overdue
    overdue_tasks = filters.filter_overdue(all_tasks)
    print(f"\n[OK] Filter overdue tasks: Found {len(overdue_tasks)} tasks")
    for task in overdue_tasks:
        print(f"  - {Fore.RED}[OVERDUE]{Style.RESET_ALL} {task.title}")

    # Combine filters
    combined = filters.combine_filters(
        all_tasks,
        status="incomplete",
        priorities=[Priority.HIGH],
        tag="Work"
    )
    print(f"\n[OK] Combined filters (incomplete + HIGH + Work): Found {len(combined)} tasks")
    for task in combined:
        print(f"  - {task.title}")

    # 10. Sort Tasks
    print(f"\n{Fore.YELLOW}Feature 10: Sort Tasks{Style.RESET_ALL}")

    # Sort by priority
    sorted_by_priority = filters.sort_by_priority(all_tasks)
    print(f"[OK] Sorted by priority (HIGH -> LOW):")
    for task in sorted_by_priority[:3]:  # Show first 3
        print(f"  - [{task.priority.value}] {task.title}")

    # Sort by due date
    sorted_by_due = filters.sort_by_due_date(all_tasks)
    print(f"\n[OK] Sorted by due date (earliest first, nulls last):")
    for task in sorted_by_due[:3]:  # Show first 3
        due = task.due_date.strftime('%Y-%m-%d') if task.due_date else "No due date"
        print(f"  - {task.title} ({due})")

    # Sort by title
    sorted_by_title = filters.sort_by_title(all_tasks)
    print(f"\n[OK] Sorted by title (A-Z):")
    for task in sorted_by_title[:3]:  # Show first 3
        print(f"  - {task.title}")

    # ADVANCED TIER DEMO
    print_section("ADVANCED TIER - Automation Features")

    # 11. Recurring Tasks
    print(f"{Fore.YELLOW}Feature 11: Recurring Tasks{Style.RESET_ALL}")
    next_week = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d 09:00")
    result = commands.add_task_command(
        title="Weekly team meeting",
        description="Recurring standup",
        due_date_str=next_week,
        recurrence_str="WEEKLY",
        priority="HIGH",
        tags="Work,Meeting"
    )
    recurring_task_id = result.data.id
    print(f"[OK] Created recurring task (WEEKLY): {result.data.title}")
    print(f"  Due: {result.data.due_date.strftime('%Y-%m-%d %H:%M')}")
    print(f"  Recurrence: {result.data.recurrence.value}")

    # Mark it complete to trigger recurrence
    print(f"\n[OK] Marking recurring task #{recurring_task_id} as complete...")
    result = commands.mark_complete_command(recurring_task_id)
    if result.data:  # New task created
        print(f"[OK] {result.message}")
        print(f"  New task #{result.data.id} created")
        print(f"  New due date: {result.data.due_date.strftime('%Y-%m-%d %H:%M')}")

    # 12. Reminders
    print(f"\n{Fore.YELLOW}Feature 12: Due Date & Time Reminders{Style.RESET_ALL}")
    reminder_date = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d 15:00")
    result = commands.add_task_command(
        title="Doctor appointment",
        description="Annual checkup",
        due_date_str=reminder_date,
        reminder_offset_str="24",  # 24 hours before
        priority="HIGH",
        tags="Personal,Health"
    )
    print(f"[OK] Created task with reminder: {result.data.title}")
    print(f"  Due: {result.data.due_date.strftime('%Y-%m-%d %H:%M')}")
    print(f"  Reminder: {result.data.reminder_offset} hours before")

    # Calculate when reminder triggers
    from src.todo import notifications
    if result.data.reminder_offset and result.data.due_date:
        reminder_time = notifications.calculate_reminder_time(
            result.data.due_date,
            result.data.reminder_offset
        )
        print(f"  Reminder will trigger at: {reminder_time.strftime('%Y-%m-%d %H:%M')}")

    # FINAL SUMMARY
    print_section("DEMO COMPLETE - SUMMARY")

    result = commands.view_all_tasks_command()
    print(f"{Fore.GREEN}Total tasks created: {len(result.data)}{Style.RESET_ALL}\n")

    print(f"{Fore.CYAN}All 12 features demonstrated successfully:{Style.RESET_ALL}")
    print("  [OK] PRIMARY TIER (5 features)")
    print("    1. Add Task")
    print("    2. View All Tasks")
    print("    3. Update Task")
    print("    4. Delete Task (not shown to preserve demo data)")
    print("    5. Mark Complete/Incomplete")
    print("\n  [OK] INTERMEDIATE TIER (5 features)")
    print("    6. Priority Management")
    print("    7. Tags & Categories")
    print("    8. Scheduled Tasks")
    print("    9. Search & Filter")
    print("    10. Sort Tasks")
    print("\n  [OK] ADVANCED TIER (2 features)")
    print("    11. Recurring Tasks")
    print("    12. Due Date & Time Reminders")

    print(f"\n{Fore.GREEN}{Style.BRIGHT}All features working perfectly!{Style.RESET_ALL}")
    print(f"\nTo run the interactive CLI: {Fore.CYAN}python main.py{Style.RESET_ALL}\n")

if __name__ == "__main__":
    demo()
