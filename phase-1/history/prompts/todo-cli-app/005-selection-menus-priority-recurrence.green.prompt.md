---
id: 005
title: Selection Menus for Priority and Recurrence
stage: green
date: 2025-12-06
surface: agent
model: claude-sonnet-4-5
feature: todo-cli-app
branch: 001-todo-cli-app
user: Malikasadjaved
command: retrospective-phr
labels: ["selection-menus", "ux", "priority", "recurrence", "tdd", "feature-f013"]
links:
  spec: specs/001-todo-cli-app/feature-selection-menus.md
  ticket: null
  adr: null
  pr: null
files:
  - src/todo/cli.py
  - tests/test_cli.py
  - specs/001-todo-cli-app/feature-selection-menus.md
  - FEATURE_F013_SUMMARY.md
tests:
  - TestSelectPriority (6 tests)
  - TestSelectRecurrence (9 tests)
---

# Prompt History Record: Selection Menus for Priority and Recurrence

## Prompt

i want to fix a feature or add a new feature --1. the app required user to write the priority level manually all the text 2.selection of recursion level by typing day,weekly,yearl .etc by typing the required day, week, year . change the option to not to write the whole but to select it by the assign option like A,B,C or 1,2,3

## Response

I implemented Feature F013: User-Friendly Selection Menus. Replaced text input with numbered selection menus for Priority (HIGH/MEDIUM/LOW) and Recurrence (DAILY/WEEKLY/BIWEEKLY/MONTHLY/YEARLY). Users now select by typing a number (1/2/3) instead of typing full text, eliminating typos and improving speed.

## Outcome / Impact

**What was accomplished:**
- Created 2 new selection menu functions following consistent UX pattern
- Added 15 comprehensive tests (all passing)
- Integrated menus into add_task_interactive() and update_task_interactive()
- Total: 117 tests passing (102 original + 15 new)
- Followed TDD + SDD methodology throughout

**Key improvements:**
1. **Faster navigation** - 1 keystroke vs typing full words
2. **Zero typos** - Invalid text like "HIHG" or "DALY" impossible
3. **Consistent UX** - Same pattern for both Priority and Recurrence
4. **Default values** - Empty input = sensible default (MEDIUM, None)

**New functions:**
- `select_priority()` - Returns Priority enum (HIGH=1, MEDIUM=2, LOW=3)
- `select_recurrence()` - Returns RecurrencePattern enum or None (DAILY=1, WEEKLY=2, BIWEEKLY=3, MONTHLY=4, YEARLY=5, None=0)

**Before (text input):**
```
Priority (HIGH/MEDIUM/LOW):
User types: "HIHG"  ← Typo!
App: Invalid priority
```

**After (selection menu):**
```
Select Priority:
  1. HIGH
  2. MEDIUM (default)
  3. LOW
Enter choice (1-3) [2]: 1
✓ No typos possible!
```

## Tests Summary

**15 new tests added (all passing):**
- `TestSelectPriority`: 6 tests
  - test_select_priority_high
  - test_select_priority_medium
  - test_select_priority_low
  - test_select_priority_default_empty_input
  - test_select_priority_invalid_input
  - test_select_priority_invalid_text

- `TestSelectRecurrence`: 9 tests
  - test_select_recurrence_none
  - test_select_recurrence_daily
  - test_select_recurrence_weekly
  - test_select_recurrence_biweekly
  - test_select_recurrence_monthly
  - test_select_recurrence_yearly
  - test_select_recurrence_default_empty_input
  - test_select_recurrence_invalid_input
  - test_select_recurrence_invalid_text

**Total test count:** 117 (100% passing)

## Files Summary

**Created:**
- `specs/001-todo-cli-app/feature-selection-menus.md` - Full specification
- `FEATURE_F013_SUMMARY.md` - Feature summary and documentation
- `demo_selection_menus.py` - Demo script showing before/after

**Modified:**
- `src/todo/cli.py` - Added select_priority() and select_recurrence() functions, updated add/update interactive functions
- `tests/test_cli.py` - Added 15 comprehensive tests

**Code changes:**
- +2 new selection menu functions
- +15 comprehensive tests with monkeypatch
- Modified: add_task_interactive(), update_task_interactive()
- Added import: RecurrencePattern enum

**Quality assurance:**
- Code formatted with black
- Zero flake8 violations
- All type hints maintained
- Complete docstrings

## Next Prompts / Suggested Actions

1. **Extend selection menus** - Apply same pattern to filter/sort operations
2. **Add keyboard shortcuts** - Arrow keys for navigation
3. **Visual indicators** - Highlight selected option
4. **Menu history** - Remember last selection per session

## Reflection / One Key Insight

**Key insight:** Selection menus prevent an entire class of errors (typos) by eliminating free-form text input. The pattern "Show options → Number selection → Validate" is universally applicable for any enumerated choice. One keystroke beats typing 6-10 characters every time.

**What worked well:**
- TDD approach with monkeypatch perfectly simulated user input
- Enum-based design made validation simple and type-safe
- Default values (MEDIUM, None) respected user's "just press Enter" habit
- Consistent pattern easily replicated for future menus

**What could be improved:**
- Could show current selection when updating tasks
- Could add "Recently used" options at top
- Could support arrow key navigation

## Evaluation

**Failure modes observed:**
- None - Feature implemented successfully with all tests passing

**Next experiment to improve prompt quality:**
- User's prompt clearly identified pain point (typing full text for selections)
- Concrete examples (A,B,C or 1,2,3) showed desired solution
- For future: This level of specificity about the problem AND desired solution is ideal
