# Feature Specification: User-Friendly Selection Menus

**Feature ID:** F013
**Title:** Replace Text Input with Numbered Selection Menus
**Type:** Enhancement (UX Improvement)
**Tier:** PRIMARY (Core UX)
**Status:** Draft
**Created:** 2025-12-06

---

## Overview

**Problem Statement:**
Currently, users must type full text for Priority (HIGH/MEDIUM/LOW) and Recurrence patterns (DAILY/WEEKLY/MONTHLY/YEARLY). This is error-prone and requires exact spelling, leading to validation errors and poor user experience.

**Proposed Solution:**
Replace free-text input with numbered selection menus where users simply press 1, 2, or 3 to choose their desired option.

---

## User Stories

### US-013-1: Priority Selection Menu
**As a** task creator
**I want to** select priority by pressing a number (1/2/3)
**So that** I don't have to type HIGH/MEDIUM/LOW and risk typos

**Acceptance Criteria:**
- [ ] When adding a task, show priority menu with options:
  ```
  Select Priority:
    1. HIGH
    2. MEDIUM (default)
    3. LOW
  Enter choice (1-3) [2]: _
  ```
- [ ] Accept input: 1, 2, 3, or Enter (defaults to 2/MEDIUM)
- [ ] Validate input (reject invalid choices like 4, abc, etc.)
- [ ] Display helpful error for invalid input
- [ ] Allow empty input to use default (MEDIUM)
- [ ] Same menu appears when updating task priority

### US-013-2: Recurrence Selection Menu
**As a** task creator
**I want to** select recurrence pattern by pressing a number (1-5)
**So that** I don't have to type DAILY/WEEKLY/MONTHLY/YEARLY

**Acceptance Criteria:**
- [ ] When adding/updating a task, show recurrence menu:
  ```
  Select Recurrence (optional):
    1. DAILY
    2. WEEKLY
    3. BIWEEKLY
    4. MONTHLY
    5. YEARLY
    0. None (no recurrence)
  Enter choice (0-5) [0]: _
  ```
- [ ] Accept input: 0, 1, 2, 3, 4, 5, or Enter (defaults to 0/None)
- [ ] Validate input (reject invalid choices)
- [ ] Display helpful error for invalid input
- [ ] Allow empty input to skip recurrence
- [ ] Same menu appears when updating task recurrence

---

## Technical Design

### Changes Required

#### 1. New Helper Functions (cli.py)

```python
def select_priority() -> Optional[Priority]:
    """Display priority selection menu and get user choice.

    Returns:
        Priority enum value or None if cancelled
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
        "3": Priority.LOW
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
        "5": RecurrencePattern.YEARLY
    }

    if choice in recurrence_map:
        return recurrence_map[choice]
    else:
        print(f"{Fore.RED}Invalid choice. Skipping recurrence.{Style.RESET_ALL}")
        return None
```

#### 2. Update add_task_interactive() (cli.py)

**Before:**
```python
priority_str = get_input("Priority (HIGH/MEDIUM/LOW) [MEDIUM]: ", required=False) or "MEDIUM"
recurrence_str = get_input("Recurrence (DAILY/WEEKLY/MONTHLY/YEARLY) [None]: ", required=False) or ""
```

**After:**
```python
priority = select_priority()  # Returns Priority enum
recurrence = select_recurrence()  # Returns RecurrencePattern or None

# Convert enum to string for command
priority_str = priority.value if priority else "MEDIUM"
recurrence_str = recurrence.value if recurrence else ""
```

#### 3. Update update_task_interactive() (cli.py)

Same pattern - replace text prompts with menu functions.

---

## Test Cases

### Test 1: Priority Selection - Valid Input
```python
def test_select_priority_valid_choices(monkeypatch):
    """Test selecting each priority option."""
    # Test HIGH
    monkeypatch.setattr('builtins.input', lambda _: '1')
    priority = select_priority()
    assert priority == Priority.HIGH

    # Test MEDIUM
    monkeypatch.setattr('builtins.input', lambda _: '2')
    priority = select_priority()
    assert priority == Priority.MEDIUM

    # Test LOW
    monkeypatch.setattr('builtins.input', lambda _: '3')
    priority = select_priority()
    assert priority == Priority.LOW
```

### Test 2: Priority Selection - Default (Empty Input)
```python
def test_select_priority_default(monkeypatch):
    """Test that empty input defaults to MEDIUM."""
    monkeypatch.setattr('builtins.input', lambda _: '')
    priority = select_priority()
    assert priority == Priority.MEDIUM
```

### Test 3: Priority Selection - Invalid Input
```python
def test_select_priority_invalid(monkeypatch, capsys):
    """Test that invalid input defaults to MEDIUM with error message."""
    monkeypatch.setattr('builtins.input', lambda _: '99')
    priority = select_priority()
    assert priority == Priority.MEDIUM

    captured = capsys.readouterr()
    assert "Invalid choice" in captured.out
```

### Test 4: Recurrence Selection - Valid Input
```python
def test_select_recurrence_valid_choices(monkeypatch):
    """Test selecting each recurrence option."""
    test_cases = [
        ('0', None),
        ('1', RecurrencePattern.DAILY),
        ('2', RecurrencePattern.WEEKLY),
        ('3', RecurrencePattern.BIWEEKLY),
        ('4', RecurrencePattern.MONTHLY),
        ('5', RecurrencePattern.YEARLY),
    ]

    for input_val, expected in test_cases:
        monkeypatch.setattr('builtins.input', lambda _: input_val)
        recurrence = select_recurrence()
        assert recurrence == expected
```

### Test 5: Recurrence Selection - Default (Empty Input)
```python
def test_select_recurrence_default(monkeypatch):
    """Test that empty input returns None."""
    monkeypatch.setattr('builtins.input', lambda _: '')
    recurrence = select_recurrence()
    assert recurrence is None
```

### Test 6: Recurrence Selection - Invalid Input
```python
def test_select_recurrence_invalid(monkeypatch, capsys):
    """Test that invalid input returns None with error message."""
    monkeypatch.setattr('builtins.input', lambda _: 'abc')
    recurrence = select_recurrence()
    assert recurrence is None

    captured = capsys.readouterr()
    assert "Invalid choice" in captured.out
```

---

## Implementation Plan

### Phase 1: Specification & Tests (TDD - RED)
1. ✅ Create this specification document
2. ⬜ Write test cases in `test_cli.py`
3. ⬜ Run tests → Verify they fail (RED phase)

### Phase 2: Implementation (TDD - GREEN)
4. ⬜ Implement `select_priority()` in `cli.py`
5. ⬜ Implement `select_recurrence()` in `cli.py`
6. ⬜ Update `add_task_interactive()` to use new functions
7. ⬜ Update `update_task_interactive()` to use new functions
8. ⬜ Run tests → Verify they pass (GREEN phase)

### Phase 3: Refactor & Document
9. ⬜ Refactor code if needed (keep tests green)
10. ⬜ Update README.md with new usage examples
11. ⬜ Update DEPLOYMENT.md
12. ⬜ Run full test suite to ensure no regressions

---

## Benefits

### User Experience
- ✅ **Faster input** - Just press a number
- ✅ **No typos** - Can't misspell HIGH/MEDIUM/LOW
- ✅ **Visual clarity** - See all options at once
- ✅ **Consistent UX** - Same pattern for priority and recurrence

### Developer Experience
- ✅ **Less validation needed** - Limited input choices
- ✅ **Easier to test** - Fewer edge cases
- ✅ **Better maintainability** - Centralized selection logic

---

## Example User Flow

### Before (Current - Error-Prone):
```
Enter title: Team meeting
Enter description: Weekly sync
Priority (HIGH/MEDIUM/LOW) [MEDIUM]: hihg  ← TYPO!
Error: Invalid priority level
Priority (HIGH/MEDIUM/LOW) [MEDIUM]: HIGH  ← Must retype
```

### After (Proposed - User-Friendly):
```
Enter title: Team meeting
Enter description: Weekly sync

Select Priority:
  1. HIGH
  2. MEDIUM (default)
  3. LOW
Enter choice (1-3) [2]: 1  ← Just press 1!
```

---

## Backward Compatibility

**Impact:** NONE

This is a CLI-only change. The underlying data models and business logic remain unchanged:
- `commands.py` still accepts priority/recurrence as strings
- `models.py` enums unchanged
- `storage.py` unchanged
- All existing tests still pass

Only the CLI input collection changes from text to menu selection.

---

## Success Metrics

- [ ] All existing tests still pass
- [ ] New tests for selection menus pass
- [ ] Manual testing confirms menus work correctly
- [ ] No increase in user input errors
- [ ] Faster task creation (fewer keystrokes)

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Users expect text input | Low | Both 1 and HIGH work (we convert) |
| Menu too long on screen | Low | Only 3-5 options, acceptable |
| Test complexity increases | Low | Use monkeypatch for input mocking |

---

## Approval

**Status:** Ready for Implementation

**Next Steps:**
1. Get user approval for specification
2. Write tests (RED phase)
3. Implement feature (GREEN phase)
4. Refactor and document

---

**Version:** 1.0
**Last Updated:** 2025-12-06
**Author:** Development Team
