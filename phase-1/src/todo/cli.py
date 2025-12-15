"""Command-line interface for Todo Application."""

from datetime import datetime
from typing import Optional
from colorama import Fore, Style, init as colorama_init

from src.todo.models import Task, Priority, RecurrencePattern
from src.todo import commands, filters


# Initialize colorama for Windows support
colorama_init(autoreset=True)


def format_task(task: Task) -> str:
    """Format a task for display with structured sections.

    Args:
        task: Task to format

    Returns:
        Formatted string representation of the task
    """
    # Status indicator
    status_icon = f"{Fore.GREEN}[✓]" if task.status == "complete" else f"{Fore.YELLOW}[ ]"

    # Priority indicator
    priority_map = {
        Priority.HIGH: f"{Fore.RED}HIGH  ",
        Priority.MEDIUM: f"{Fore.YELLOW}MEDIUM",
        Priority.LOW: f"{Fore.GREEN}LOW   ",
    }
    priority_str = priority_map.get(task.priority, "UNKNOWN")

    # Overdue indicator
    overdue_indicator = f" {Fore.RED}[OVERDUE!]{Style.RESET_ALL}" if task.is_overdue else ""

    # Build structured output with clear sections
    output_lines = []

    # Header line with ID and title
    output_lines.append(
        f"{Style.BRIGHT}{'-' * 80}{Style.RESET_ALL}"
    )
    output_lines.append(
        f"{status_icon} {Style.BRIGHT}#{task.id:03d}{Style.RESET_ALL} | "
        f"{Style.BRIGHT}{task.title}{Style.RESET_ALL}{overdue_indicator}"
    )

    # Metadata section
    metadata_parts = []
    metadata_parts.append(f"{Fore.CYAN}Priority:{Style.RESET_ALL} {priority_str}{Style.RESET_ALL}")
    metadata_parts.append(f"{Fore.CYAN}Type:{Style.RESET_ALL} {task.task_type.value.title()}")
    metadata_parts.append(f"{Fore.CYAN}Status:{Style.RESET_ALL} {task.status.title()}")

    output_lines.append(f"      | {' | '.join(metadata_parts)}")

    # Description section (if exists)
    if task.description:
        output_lines.append(f"      |")
        output_lines.append(f"      | {Fore.CYAN}Description:{Style.RESET_ALL}")
        output_lines.append(f"      |   {task.description}")

    # Schedule section (if has due date or recurrence)
    if task.due_date or task.recurrence:
        output_lines.append(f"      |")
        output_lines.append(f"      | {Fore.MAGENTA}Schedule:{Style.RESET_ALL}")
        if task.due_date:
            due_date_formatted = task.due_date.strftime('%Y-%m-%d %H:%M')
            output_lines.append(f"      |   Due: {due_date_formatted}")
        if task.recurrence:
            output_lines.append(f"      |   Recurrence: {task.recurrence.value.title()}")
        if task.reminder_offset:
            output_lines.append(f"      |   Reminder: {task.reminder_offset} hours before")

    # Tags section (if exists)
    if task.tags:
        output_lines.append(f"      |")
        tags_formatted = ", ".join([f"{Fore.CYAN}#{tag}{Style.RESET_ALL}" for tag in task.tags])
        output_lines.append(f"      | {Fore.CYAN}Tags:{Style.RESET_ALL} {tags_formatted}")

    # Dates section
    output_lines.append(f"      |")
    output_lines.append(f"      | {Fore.WHITE}Created:{Style.RESET_ALL} {task.created_date.strftime('%Y-%m-%d %H:%M')}")
    if task.completed_date:
        output_lines.append(f"      | {Fore.GREEN}Completed:{Style.RESET_ALL} {task.completed_date.strftime('%Y-%m-%d %H:%M')}")

    return "\n".join(output_lines)


def display_menu() -> None:
    """Display the main menu."""
    print(f"\n{Style.BRIGHT}{'='*60}")
    print(f"{Fore.CYAN}{Style.BRIGHT}TODO APPLICATION - MAIN MENU")
    print(f"{Style.BRIGHT}{'='*60}{Style.RESET_ALL}\n")

    print(f"{Style.BRIGHT}PRIMARY TIER - Core Features{Style.RESET_ALL}")
    print(f"  {Fore.GREEN}1.{Style.RESET_ALL} Add Task")
    print(f"  {Fore.GREEN}2.{Style.RESET_ALL} View All Tasks")
    print(f"  {Fore.GREEN}3.{Style.RESET_ALL} Update Task")
    print(f"  {Fore.GREEN}4.{Style.RESET_ALL} Delete Task")
    print(f"  {Fore.GREEN}5.{Style.RESET_ALL} Status Mark (Complete/Incomplete)")

    print(f"\n{Style.BRIGHT}INTERMEDIATE TIER - Organization{Style.RESET_ALL}")
    print(f"  {Fore.YELLOW}6.{Style.RESET_ALL} Search Tasks")
    print(f"  {Fore.YELLOW}7.{Style.RESET_ALL} Filter Tasks")
    print(f"  {Fore.YELLOW}8.{Style.RESET_ALL} Sort Tasks")

    print(f"\n{Style.BRIGHT}ADVANCED TIER - Automation{Style.RESET_ALL}")
    print(
        f"  {Fore.RED}9.{Style.RESET_ALL} Recurring Tasks "
        f"(Automatic - set via Add/Update)"
    )
    print(
        f"  {Fore.RED}10.{Style.RESET_ALL} Reminders "
        f"(Automatic - set via Add/Update)"
    )

    print(f"\n{Fore.WHITE}0. Exit{Style.RESET_ALL}")
    print(f"{Style.BRIGHT}{'='*60}{Style.RESET_ALL}\n")


def get_input(prompt: str, required: bool = True) -> Optional[str]:
    """Get user input with optional requirement.

    Args:
        prompt: Prompt to display
        required: If True, keep asking until non-empty input received

    Returns:
        User input string or None if not required and empty
    """
    while True:
        value = input(f"{Fore.CYAN}{prompt}{Style.RESET_ALL}").strip()
        if value or not required:
            return value if value else None
        print(f"{Fore.RED}This field is required. Please try again.{Style.RESET_ALL}")


def select_priority() -> Priority:
    """Display priority selection menu and get user choice.

    Returns:
        Priority enum value (defaults to MEDIUM)
    """
    print(f"\n{Fore.CYAN}Select Priority:{Style.RESET_ALL}")
    print("  1. HIGH")
    print("  2. MEDIUM (default)")
    print("  3. LOW")

    choice = get_input("Enter choice (1-3) [2]: ", required=False)

    # Default to MEDIUM if empty
    if not choice:
        return Priority.MEDIUM

    priority_map = {
        "1": Priority.HIGH,
        "2": Priority.MEDIUM,
        "3": Priority.LOW,
    }

    if choice in priority_map:
        return priority_map[choice]
    else:
        print(f"{Fore.RED}Invalid choice. Using MEDIUM.{Style.RESET_ALL}")
        return Priority.MEDIUM


def select_recurrence() -> Optional[RecurrencePattern]:
    """Display recurrence selection menu and get user choice.

    Returns:
        RecurrencePattern enum value or None for no recurrence
    """
    print(f"\n{Fore.CYAN}Select Recurrence (optional):{Style.RESET_ALL}")
    print("  1. DAILY")
    print("  2. WEEKLY")
    print("  3. BIWEEKLY")
    print("  4. MONTHLY")
    print("  5. YEARLY")
    print("  0. None (no recurrence)")

    choice = get_input("Enter choice (0-5) [0]: ", required=False)

    # Default to None if empty
    if not choice or choice == "0":
        return None

    recurrence_map = {
        "1": RecurrencePattern.DAILY,
        "2": RecurrencePattern.WEEKLY,
        "3": RecurrencePattern.BIWEEKLY,
        "4": RecurrencePattern.MONTHLY,
        "5": RecurrencePattern.YEARLY,
    }

    if choice in recurrence_map:
        return recurrence_map[choice]
    else:
        print(f"{Fore.RED}Invalid choice. Skipping recurrence.{Style.RESET_ALL}")
        return None


def select_status_action() -> str:
    """Display status mark submenu and get user choice.

    Returns:
        Action string: "complete", "incomplete", or "back"
    """
    print(f"\n{Style.BRIGHT}{'='*60}")
    print(f"{Fore.CYAN}{Style.BRIGHT}STATUS MARK SUBMENU")
    print(f"{Style.BRIGHT}{'='*60}{Style.RESET_ALL}\n")
    print(f"  {Fore.GREEN}A.{Style.RESET_ALL} Mark Task Complete")
    print(f"  {Fore.YELLOW}B.{Style.RESET_ALL} Mark Task Incomplete")
    print(f"  {Fore.WHITE}0.{Style.RESET_ALL} Back to Main Menu\n")

    choice = get_input("Enter choice (A/B/0): ", required=False)

    # Default to back if empty
    if not choice:
        return "back"

    # Convert to uppercase for comparison
    choice = choice.upper()

    action_map = {
        "A": "complete",
        "B": "incomplete",
        "0": "back",
    }

    if choice in action_map:
        return action_map[choice]
    else:
        print(f"{Fore.RED}Invalid choice. Returning to main menu.{Style.RESET_ALL}")
        return "back"


def select_filter_status() -> str:
    """Display filter status selection menu and get user choice.

    Returns:
        Status filter: "complete", "incomplete", or "all"
    """
    print(f"\n{Fore.CYAN}Filter by Status:{Style.RESET_ALL}")
    print("  1. Complete")
    print("  2. Incomplete")
    print("  3. All (default)")

    choice = get_input("Enter choice (1-3) [3]: ", required=False)

    # Default to all if empty
    if not choice:
        return "all"

    status_map = {
        "1": "complete",
        "2": "incomplete",
        "3": "all",
    }

    if choice in status_map:
        return status_map[choice]
    else:
        print(f"{Fore.RED}Invalid choice. Using 'all'.{Style.RESET_ALL}")
        return "all"


def select_filter_priority() -> str:
    """Display filter priority selection menu and get user choice.

    Returns:
        Priority filter: "HIGH", "MEDIUM", "LOW", or "all"
    """
    print(f"\n{Fore.CYAN}Filter by Priority:{Style.RESET_ALL}")
    print("  1. HIGH")
    print("  2. MEDIUM")
    print("  3. LOW")
    print("  4. All (default)")

    choice = get_input("Enter choice (1-4) [4]: ", required=False)

    # Default to all if empty
    if not choice:
        return "all"

    priority_map = {
        "1": "HIGH",
        "2": "MEDIUM",
        "3": "LOW",
        "4": "all",
    }

    if choice in priority_map:
        return priority_map[choice]
    else:
        print(f"{Fore.RED}Invalid choice. Using 'all'.{Style.RESET_ALL}")
        return "all"


def select_sort_option() -> str:
    """Display sort option selection menu and get user choice.

    Returns:
        Sort criteria: "due_date", "priority", "title", or "created"
    """
    print(f"\n{Fore.CYAN}Sort By:{Style.RESET_ALL}")
    print("  1. Due Date (default)")
    print("  2. Priority")
    print("  3. Title (A-Z)")
    print("  4. Created Date")

    choice = get_input("Enter choice (1-4) [1]: ", required=False)

    # Default to due_date if empty
    if not choice:
        return "due_date"

    sort_map = {
        "1": "due_date",
        "2": "priority",
        "3": "title",
        "4": "created",
    }

    if choice in sort_map:
        return sort_map[choice]
    else:
        print(f"{Fore.RED}Invalid choice. Using 'due_date'.{Style.RESET_ALL}")
        return "due_date"


def ask_retry(field_name: str, example: str) -> bool:
    """Ask user if they want to retry after validation error.

    Args:
        field_name: Name of the field that had validation error
        example: Example of correct format

    Returns:
        True if user wants to retry, False otherwise
    """
    print(
        f"\n{Fore.YELLOW}Would you like to try entering "
        f"{field_name} again?{Style.RESET_ALL}"
    )
    print(f"{Fore.CYAN}Example: {example}{Style.RESET_ALL}")

    choice = get_input("Retry? (yes/no) [no]: ", required=False)
    return choice.lower() in ["yes", "y"] if choice else False


def get_date_input_with_retry(prompt: str) -> Optional[datetime]:
    """Get date input with retry on validation error.

    Args:
        prompt: Input prompt to display

    Returns:
        Parsed datetime object or None if skipped/canceled
    """
    while True:
        date_str = get_input(prompt, required=False)
        if not date_str:
            return None

        parsed_date = commands.parse_date(date_str)
        if parsed_date is not None:
            return parsed_date

        # Invalid date format
        print(f"{Fore.RED}❌ Invalid date format.{Style.RESET_ALL}")
        if ask_retry("due date", "2025-12-31 or 2025-12-31 14:30"):
            continue  # Retry
        else:
            return None  # Skip


def get_task_id_with_retry(prompt: str) -> Optional[int]:
    """Get task ID input with retry on validation error.

    Args:
        prompt: Input prompt to display

    Returns:
        Valid task ID (positive integer) or None if canceled
    """
    while True:
        task_id_str = get_input(prompt, required=False)
        if not task_id_str:
            return None

        try:
            task_id = int(task_id_str)
            if task_id <= 0:
                raise ValueError("Task ID must be positive")
            return task_id
        except ValueError:
            print(
                f"{Fore.RED}❌ Invalid task ID. "
                f"Must be a positive number.{Style.RESET_ALL}"
            )
            if ask_retry("task ID", "1, 2, 3, etc."):
                continue  # Retry
            else:
                return None  # Cancel


def get_title_with_retry() -> Optional[str]:
    """Get title input with retry on empty value.

    Returns:
        Valid title string or None if canceled
    """
    while True:
        title = get_input("Title: ", required=False)

        if title and title.strip():
            return title.strip()

        print(f"{Fore.RED}❌ Title is required and cannot be empty.{Style.RESET_ALL}")
        if ask_retry("title", "'Complete project report' or 'Buy groceries'"):
            continue  # Retry
        else:
            return None  # Cancel


def add_task_interactive() -> None:
    """Interactive flow for adding a task."""
    print(f"\n{Style.BRIGHT}Add New Task{Style.RESET_ALL}")
    print(f"{'-'*60}")

    # Use retry function for title (required field)
    title = get_title_with_retry()
    if title is None:
        print(f"\n{Fore.YELLOW}Task creation canceled.{Style.RESET_ALL}")
        return

    description = get_input("Description (optional): ", required=False) or ""

    # Use selection menu for priority
    priority_enum = select_priority()
    priority = priority_enum.value

    tags = get_input("Tags (comma-separated, optional): ", required=False) or ""

    # Use retry function for due date (with validation)
    due_date_obj = get_date_input_with_retry(
        "Due Date (YYYY-MM-DD or YYYY-MM-DD HH:MM, optional): "
    )
    due_date = due_date_obj.strftime("%Y-%m-%d %H:%M") if due_date_obj else ""

    # Use selection menu for recurrence
    recurrence_enum = select_recurrence()
    recurrence = recurrence_enum.value if recurrence_enum else ""

    reminder = (
        get_input("Reminder (hours before due date, optional): ", required=False) or ""
    )

    result = commands.add_task_command(
        title=title,
        description=description,
        priority=priority,
        tags=tags,
        due_date_str=due_date,
        recurrence_str=recurrence,
        reminder_offset_str=reminder,
    )

    if result.success:
        print(f"\n{Fore.GREEN}✓ {result.message}{Style.RESET_ALL}")
        if result.data:
            print(f"\n{format_task(result.data)}")
    else:
        print(f"\n{Fore.RED}❌ {result.message}{Style.RESET_ALL}")
        for error in result.errors:
            print(f"  {Fore.RED}- {error}{Style.RESET_ALL}")


def view_all_tasks_interactive() -> None:
    """Interactive flow for viewing all tasks."""
    print(f"\n{Style.BRIGHT}{'='*80}")
    print(f"{Fore.CYAN}{Style.BRIGHT}ALL TASKS")
    print(f"{Style.BRIGHT}{'='*80}{Style.RESET_ALL}\n")

    result = commands.view_all_tasks_command()

    if result.success:
        if not result.data:
            print(f"{Fore.YELLOW}No tasks found. Add your first task!{Style.RESET_ALL}")
        else:
            # Display summary header
            total = len(result.data)
            complete = sum(1 for t in result.data if t.status == "complete")
            incomplete = total - complete
            overdue = sum(1 for t in result.data if t.is_overdue)

            print(f"{Style.BRIGHT}SUMMARY{Style.RESET_ALL}")
            print(f"  Total Tasks: {Fore.CYAN}{total}{Style.RESET_ALL}")
            print(f"  Complete: {Fore.GREEN}{complete}{Style.RESET_ALL}")
            print(f"  Incomplete: {Fore.YELLOW}{incomplete}{Style.RESET_ALL}")
            if overdue > 0:
                print(f"  Overdue: {Fore.RED}{overdue}{Style.RESET_ALL}")
            print()

            # Display tasks
            for task in result.data:
                print(format_task(task))

            print(f"\n{Style.BRIGHT}{'-' * 80}{Style.RESET_ALL}")
            print(f"{Fore.GREEN}[OK] {result.message}{Style.RESET_ALL}")
    else:
        print(f"{Fore.RED}[ERROR] {result.message}{Style.RESET_ALL}")


def update_task_interactive() -> None:
    """Interactive flow for updating a task."""
    print(f"\n{Style.BRIGHT}Update Task{Style.RESET_ALL}")
    print(f"{'-'*60}")

    # Use retry function for task ID
    task_id = get_task_id_with_retry("Task ID: ")
    if task_id is None:
        print(f"\n{Fore.YELLOW}Update canceled.{Style.RESET_ALL}")
        return

    print(f"{Fore.YELLOW}Leave blank to keep current value{Style.RESET_ALL}")

    updates = {}
    title = get_input("New Title (optional): ", required=False)
    if title:
        updates["title"] = title

    description = get_input("New Description (optional): ", required=False)
    if description:
        updates["description"] = description

    # Ask if user wants to update priority
    update_priority = get_input("Update Priority? (y/n) [n]: ", required=False)
    if update_priority and update_priority.lower() in ["y", "yes"]:
        priority_enum = select_priority()
        updates["priority"] = priority_enum.value

    tags = get_input("New Tags (comma-separated, optional): ", required=False)
    if tags:
        updates["tags"] = tags

    # Ask if user wants to update due date
    update_due_date = get_input("Update Due Date? (y/n) [n]: ", required=False)
    if update_due_date and update_due_date.lower() in ["y", "yes"]:
        due_date_obj = get_date_input_with_retry(
            "New Due Date (YYYY-MM-DD or YYYY-MM-DD HH:MM): "
        )
        if due_date_obj:
            updates["due_date"] = due_date_obj.strftime("%Y-%m-%d %H:%M")

    # Ask if user wants to update recurrence
    update_recurrence = get_input("Update Recurrence? (y/n) [n]: ", required=False)
    if update_recurrence and update_recurrence.lower() in ["y", "yes"]:
        recurrence_enum = select_recurrence()
        if recurrence_enum:
            updates["recurrence"] = recurrence_enum.value

    if not updates:
        print(f"{Fore.YELLOW}No updates provided.{Style.RESET_ALL}")
        return

    result = commands.update_task_command(task_id, **updates)

    if result.success:
        print(f"\n{Fore.GREEN}[OK] {result.message}{Style.RESET_ALL}")
        if result.data:
            print(f"\n{format_task(result.data)}")
    else:
        print(f"\n{Fore.RED}[ERROR] {result.message}{Style.RESET_ALL}")
        for error in result.errors:
            print(f"  {Fore.RED}- {error}{Style.RESET_ALL}")


def delete_task_interactive() -> None:
    """Interactive flow for deleting a task."""
    print(f"\n{Style.BRIGHT}Delete Task{Style.RESET_ALL}")
    print(f"{'-'*60}")

    # Use retry function for task ID
    task_id = get_task_id_with_retry("Task ID: ")
    if task_id is None:
        print(f"\n{Fore.YELLOW}Deletion canceled.{Style.RESET_ALL}")
        return

    # First call to get confirmation prompt
    result = commands.delete_task_command(task_id, confirmed=False)

    if not result.success:
        print(f"{Fore.RED}❌ {result.message}{Style.RESET_ALL}")
        return

    # Show task and ask for confirmation
    if result.data:
        print(f"\n{format_task(result.data)}")

    confirm = get_input(f"\n{result.message} (yes/no): ", required=True)

    if confirm.lower() not in ["yes", "y"]:
        print(f"{Fore.YELLOW}Deletion cancelled.{Style.RESET_ALL}")
        return

    # Confirmed - delete task
    result = commands.delete_task_command(task_id, confirmed=True)

    if result.success:
        print(f"\n{Fore.GREEN}✓ {result.message}{Style.RESET_ALL}")
    else:
        print(f"\n{Fore.RED}❌ {result.message}{Style.RESET_ALL}")


def mark_complete_interactive() -> None:
    """Interactive flow for marking task as complete."""
    print(f"\n{Style.BRIGHT}Mark Task Complete{Style.RESET_ALL}")
    print(f"{'-'*60}")

    # Use retry function for task ID
    task_id = get_task_id_with_retry("Task ID: ")
    if task_id is None:
        print(f"\n{Fore.YELLOW}Operation canceled.{Style.RESET_ALL}")
        return

    result = commands.mark_complete_command(task_id)

    if result.success:
        print(f"\n{Fore.GREEN}✓ {result.message}{Style.RESET_ALL}")
        if result.data:
            print(f"\n{format_task(result.data)}")
    else:
        print(f"\n{Fore.RED}❌ {result.message}{Style.RESET_ALL}")
        for error in result.errors:
            print(f"  {Fore.RED}- {error}{Style.RESET_ALL}")


def mark_incomplete_interactive() -> None:
    """Interactive flow for marking task as incomplete."""
    print(f"\n{Style.BRIGHT}Mark Task Incomplete{Style.RESET_ALL}")
    print(f"{'-'*60}")

    # Use retry function for task ID
    task_id = get_task_id_with_retry("Task ID: ")
    if task_id is None:
        print(f"\n{Fore.YELLOW}Operation canceled.{Style.RESET_ALL}")
        return

    result = commands.mark_incomplete_command(task_id)

    if result.success:
        print(f"\n{Fore.GREEN}[OK] {result.message}{Style.RESET_ALL}")
        if result.data:
            print(f"\n{format_task(result.data)}")
    else:
        print(f"\n{Fore.RED}[ERROR] {result.message}{Style.RESET_ALL}")
        for error in result.errors:
            print(f"  {Fore.RED}- {error}{Style.RESET_ALL}")


def search_tasks_interactive() -> None:
    """Interactive flow for searching tasks."""
    print(f"\n{Style.BRIGHT}{'='*80}")
    print(f"{Fore.CYAN}{Style.BRIGHT}SEARCH TASKS")
    print(f"{Style.BRIGHT}{'='*80}{Style.RESET_ALL}\n")

    keyword = get_input("Search keyword: ", required=True)

    result = commands.view_all_tasks_command()
    if not result.success or not result.data:
        print(f"{Fore.YELLOW}No tasks found.{Style.RESET_ALL}")
        return

    # Apply search filter
    filtered_tasks = filters.search_tasks(result.data, keyword)

    if not filtered_tasks:
        print(f"\n{Fore.YELLOW}No tasks match '{keyword}'.{Style.RESET_ALL}")
    else:
        result_count = len(filtered_tasks)
        print(f"\n{Style.BRIGHT}SEARCH RESULTS{Style.RESET_ALL}")
        print(f"  Keyword: {Fore.CYAN}'{keyword}'{Style.RESET_ALL}")
        print(f"  Matches: {Fore.GREEN}{result_count}{Style.RESET_ALL} out of {len(result.data)} tasks")
        print()

        for task in filtered_tasks:
            print(format_task(task))

        print(f"\n{Style.BRIGHT}{'-' * 80}{Style.RESET_ALL}")
        print(f"{Fore.GREEN}[OK] Search complete{Style.RESET_ALL}")


def filter_tasks_interactive() -> None:
    """Interactive flow for filtering tasks."""
    print(f"\n{Style.BRIGHT}{'='*80}")
    print(f"{Fore.CYAN}{Style.BRIGHT}FILTER TASKS")
    print(f"{Style.BRIGHT}{'='*80}{Style.RESET_ALL}\n")

    # Get all tasks
    result = commands.view_all_tasks_command()
    if not result.success or not result.data:
        print(f"{Fore.YELLOW}No tasks found.{Style.RESET_ALL}")
        return

    # Collect filter criteria using selection menus
    print(f"{Fore.CYAN}{Style.BRIGHT}SELECT FILTER CRITERIA{Style.RESET_ALL}\n")

    # Use selection menu for status
    status_filter = select_filter_status()
    status = status_filter if status_filter != "all" else None

    # Use selection menu for priority
    priority_filter = select_filter_priority()
    priorities = None
    if priority_filter != "all":
        try:
            priorities = [Priority[priority_filter]]
        except KeyError:
            pass

    # Tag is still text input (appropriate for free-form text)
    tag_input = get_input("Tag (optional): ", required=False)
    tag = tag_input if tag_input else None

    # Yes/no questions remain as text (simple choices)
    overdue_input = get_input("Show only overdue? (yes/no) [no]: ", required=False)
    overdue_only = overdue_input.lower() in ["yes", "y"] if overdue_input else False

    today_input = get_input("Show only due today? (yes/no) [no]: ", required=False)
    due_today_only = today_input.lower() in ["yes", "y"] if today_input else False

    week_input = get_input("Show only due this week? (yes/no) [no]: ", required=False)
    due_this_week_only = week_input.lower() in ["yes", "y"] if week_input else False

    # Apply filters
    filtered_tasks = filters.combine_filters(
        result.data,
        status=status,
        priorities=priorities,
        tag=tag,
        overdue_only=overdue_only,
        due_today_only=due_today_only,
        due_this_week_only=due_this_week_only,
    )

    # Display results
    filter_summary = filters.get_filter_summary(
        status=status,
        priorities=priorities,
        tag=tag,
        overdue_only=overdue_only,
        due_today_only=due_today_only,
        due_this_week_only=due_this_week_only,
    )

    print(f"\n{Style.BRIGHT}FILTER RESULTS{Style.RESET_ALL}")
    print(f"  {filter_summary}")
    print(f"  Matches: {Fore.GREEN}{len(filtered_tasks)}{Style.RESET_ALL} out of {len(result.data)} tasks")
    print()

    if not filtered_tasks:
        print(f"{Fore.YELLOW}No tasks match the filter criteria.{Style.RESET_ALL}")
    else:
        for task in filtered_tasks:
            print(format_task(task))

        print(f"\n{Style.BRIGHT}{'-' * 80}{Style.RESET_ALL}")
        print(f"{Fore.GREEN}[OK] Filter complete{Style.RESET_ALL}")


def sort_tasks_interactive() -> None:
    """Interactive flow for sorting tasks."""
    print(f"\n{Style.BRIGHT}{'='*80}")
    print(f"{Fore.CYAN}{Style.BRIGHT}SORT TASKS")
    print(f"{Style.BRIGHT}{'='*80}{Style.RESET_ALL}\n")

    # Get all tasks
    result = commands.view_all_tasks_command()
    if not result.success or not result.data:
        print(f"{Fore.YELLOW}No tasks found.{Style.RESET_ALL}")
        return

    # Use selection menu for sort option
    sort_key = select_sort_option()

    sort_map = {
        "due_date": ("due_date", filters.sort_by_due_date),
        "priority": ("priority", filters.sort_by_priority),
        "title": ("title", filters.sort_by_title),
        "created": ("created_date", filters.sort_by_created_date),
    }

    if sort_key not in sort_map:
        print(f"{Fore.RED}Invalid choice.{Style.RESET_ALL}")
        return

    sort_desc_key, sort_func = sort_map[sort_key]
    sorted_tasks = sort_func(result.data)

    # Display sorted results
    sort_desc = filters.get_sort_description(sort_desc_key)
    print(f"\n{Style.BRIGHT}SORTED RESULTS{Style.RESET_ALL}")
    print(f"  Sort Order: {Fore.CYAN}{sort_desc}{Style.RESET_ALL}")
    print(f"  Total Tasks: {Fore.GREEN}{len(sorted_tasks)}{Style.RESET_ALL}")
    print()

    for task in sorted_tasks:
        print(format_task(task))

    print(f"\n{Style.BRIGHT}{'-' * 80}{Style.RESET_ALL}")
    print(f"{Fore.GREEN}[OK] Sort complete{Style.RESET_ALL}")


def run_cli() -> None:
    """Main CLI event loop."""
    print(f"\n{Fore.CYAN}{Style.BRIGHT}Welcome to Todo Application!{Style.RESET_ALL}")

    while True:
        display_menu()
        choice = get_input("Enter your choice: ", required=True)

        if choice == "0":
            print(f"\n{Fore.CYAN}Goodbye!{Style.RESET_ALL}\n")
            break
        elif choice == "1":
            add_task_interactive()
        elif choice == "2":
            view_all_tasks_interactive()
        elif choice == "3":
            update_task_interactive()
        elif choice == "4":
            delete_task_interactive()
        elif choice == "5":
            # Status Mark submenu
            action = select_status_action()
            if action == "complete":
                mark_complete_interactive()
            elif action == "incomplete":
                mark_incomplete_interactive()
            # If "back", do nothing and return to main menu
        elif choice == "6":
            search_tasks_interactive()
        elif choice == "7":
            filter_tasks_interactive()
        elif choice == "8":
            sort_tasks_interactive()
        elif choice == "9":
            print(f"\n{Fore.CYAN}Recurring Tasks:{Style.RESET_ALL}")
            print(
                "Recurring tasks are created automatically when you "
                "mark a recurring task complete."
            )
            print("To create a recurring task:")
            print("  1. Select 'Add Task' or 'Update Task'")
            print("  2. Set a recurrence pattern (DAILY/WEEKLY/MONTHLY/YEARLY)")
            print("  3. When you mark it complete, a new instance is auto-created")
        elif choice == "10":
            print(f"\n{Fore.CYAN}Reminders:{Style.RESET_ALL}")
            print("Reminders are set when creating or updating a task.")
            print("To set a reminder:")
            print("  1. Select 'Add Task' or 'Update Task'")
            print("  2. Set a due_date")
            print("  3. Set reminder_offset (hours before due date)")
            print("Reminders will trigger based on your settings.")
        else:
            print(f"\n{Fore.RED}Invalid choice. Please try again.{Style.RESET_ALL}")

        input(f"\n{Fore.WHITE}Press Enter to continue...{Style.RESET_ALL}")
