# Feature Specification: Menu Organization & Universal Selection Menus

**Feature ID:** F014
**Title:** Reorganize Primary Menu & Add Selection Menus Throughout App
**Status:** Planning
**Created:** 2025-12-06

## Overview

Two related UX improvements:
1. **Menu Reorganization:** Consolidate "Mark Complete" and "Mark Incomplete" under a new "Status Mark" submenu in Primary Tier
2. **Universal Selection Menus:** Replace all text input throughout the app with numbered selection options (1,2,3 or A,B,C)

## User Stories

### US-014-1: Status Mark Submenu (Menu Reorganization)
**As a** user
**I want to** see "Status Mark (Complete/Incomplete)" as a single menu option
**So that** the Primary Tier menu is cleaner with 5 options instead of 6

**Acceptance Criteria:**
- Main menu shows "5. Status Mark (Complete/Incomplete)" in Primary Tier
- Selecting option 5 opens a submenu with:
  - A. Mark Task Complete
  - B. Mark Task Incomplete
  - 0. Back to Main Menu
- After marking status, return to main menu
- Primary Tier now has exactly 5 options (was 6)

### US-014-2: Universal Selection Menus Throughout App
**As a** user
**I want to** select all options using numbers (1,2,3) instead of typing full text
**So that** I can navigate faster and avoid typos

**Current Issues:**
- Main menu: User must type full keywords like "add task", "update task", "delete task"
- Filter menu: User must type "complete", "incomplete", "all"
- Sort menu: User must type "due_date", "priority", "title", "created"
- Search: Only place where text input is appropriate (for keywords)

**Acceptance Criteria:**
- Main menu accepts numbers only (1-11, 0 for exit)
- All submenus use numbered options
- Filter submenu uses numbers for:
  - Status selection (1=complete, 2=incomplete, 3=all)
  - Priority selection (1=HIGH, 2=MEDIUM, 3=LOW, 4=all)
  - Tag selection (show numbered list of existing tags)
- Sort submenu uses numbers:
  - 1. By Due Date
  - 2. By Priority
  - 3. By Title (A-Z)
  - 4. By Created Date
- Invalid input shows error and re-prompts
- Empty input shows default choice (where applicable)

## Technical Design

### 1. Menu Structure Changes

**Current Primary Tier (6 options):**
```
1. Add Task
2. View All Tasks
3. Update Task
4. Delete Task
5. Mark Task Complete
6. Mark Task Incomplete
```

**New Primary Tier (5 options):**
```
1. Add Task
2. View All Tasks
3. Update Task
4. Delete Task
5. Status Mark (Complete/Incomplete)  ← NEW SUBMENU
```

**New Status Mark Submenu:**
```
=== Status Mark ===
A. Mark Task Complete
B. Mark Task Incomplete
0. Back to Main Menu
```

### 2. Selection Menu Functions

**New Functions to Add:**
- `select_status_action() -> str` - Status submenu (A/B/0)
- `select_filter_status() -> str` - Filter by status (1/2/3)
- `select_filter_priority() -> str` - Filter by priority (1/2/3/4)
- `select_sort_option() -> str` - Sort criteria (1/2/3/4)

**Functions to Update:**
- `display_menu()` - Show new 5-option Primary Tier
- `run()` - Handle option "5" to open status submenu
- `filter_tasks_interactive()` - Use selection menus instead of text input
- `sort_tasks_interactive()` - Use selection menus instead of text input

### 3. Input Validation

All selection functions should:
1. Display clear numbered options
2. Accept only valid numbers (reject text)
3. Show default choice in brackets [default]
4. Re-prompt on invalid input with error message
5. Accept empty input for defaults (where applicable)

## Test Cases

### TC-014-1: Status Mark Submenu
```python
def test_status_mark_submenu_complete():
    """Test selecting 'Mark Complete' from Status Mark submenu."""
    # Given: User selects option 5 from main menu
    # And: User selects A from status submenu
    # When: User enters task ID
    # Then: Task is marked complete
    # And: Returns to main menu

def test_status_mark_submenu_incomplete():
    """Test selecting 'Mark Incomplete' from Status Mark submenu."""
    # Given: User selects option 5 from main menu
    # And: User selects B from status submenu
    # When: User enters task ID
    # Then: Task is marked incomplete
    # And: Returns to main menu

def test_status_mark_submenu_back():
    """Test selecting 'Back' from Status Mark submenu."""
    # Given: User selects option 5 from main menu
    # When: User selects 0 from status submenu
    # Then: Returns to main menu without action
```

### TC-014-2: Filter Selection Menus
```python
def test_select_filter_status_complete():
    """Test selecting 'complete' status via number."""
    # Given: Filter menu is displayed
    # When: User enters "1"
    # Then: Returns "complete"

def test_select_filter_priority_high():
    """Test selecting HIGH priority via number."""
    # Given: Filter priority menu is displayed
    # When: User enters "1"
    # Then: Returns Priority.HIGH

def test_select_filter_invalid_input():
    """Test handling invalid filter input."""
    # Given: Filter menu is displayed
    # When: User enters "99"
    # Then: Shows error and re-prompts
```

### TC-014-3: Sort Selection Menu
```python
def test_select_sort_by_due_date():
    """Test selecting sort by due date."""
    # Given: Sort menu is displayed
    # When: User enters "1"
    # Then: Returns "due_date"

def test_select_sort_by_priority():
    """Test selecting sort by priority."""
    # Given: Sort menu is displayed
    # When: User enters "2"
    # Then: Returns "priority"
```

## Implementation Checklist

- [ ] Write tests for status submenu (TC-014-1)
- [ ] Write tests for filter selection menus (TC-014-2)
- [ ] Write tests for sort selection menu (TC-014-3)
- [ ] Implement `select_status_action()` function
- [ ] Implement `select_filter_status()` function
- [ ] Implement `select_filter_priority()` function
- [ ] Implement `select_sort_option()` function
- [ ] Update `display_menu()` to show 5 Primary options
- [ ] Update `run()` to handle option 5 as submenu
- [ ] Update `filter_tasks_interactive()` to use selection menus
- [ ] Update `sort_tasks_interactive()` to use selection menus
- [ ] Run all tests (should have 117+ passing)
- [ ] Format with black
- [ ] Verify with flake8

## Notes

- Keep search functionality as text input (appropriate for keywords)
- Consider using letters (A,B,C) for submenus to distinguish from main menu numbers
- Maintain backward compatibility with existing test suite
- All new selection menus should follow same pattern as F013 (Priority/Recurrence menus)

## Related Features

- **F013:** Selection Menus for Priority and Recurrence (completed)
- **F001-F012:** Original 12 features (all use selection menus after this enhancement)

## Success Criteria

1. Main menu has exactly 5 Primary Tier options
2. Status Mark submenu works correctly (A/B/0 options)
3. All filter operations use numbered selection
4. All sort operations use numbered selection
5. All 117+ tests pass
6. Code formatted with black
7. No flake8 violations
8. User can complete all tasks using only number keys (except search keywords)
