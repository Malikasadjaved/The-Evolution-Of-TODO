---
id: 006
title: Menu Reorganization and Universal Selection Menus
stage: green
date: 2025-12-06
surface: agent
model: claude-sonnet-4-5
feature: todo-cli-app
branch: 001-todo-cli-app
user: Malikasadjaved
command: retrospective-phr
labels: ["menu-organization", "ux", "selection-menus", "status-mark", "filter", "sort", "tdd", "feature-f014"]
links:
  spec: specs/001-todo-cli-app/feature-menu-improvements.md
  ticket: null
  adr: null
  pr: null
files:
  - src/todo/cli.py
  - tests/test_cli.py
  - specs/001-todo-cli-app/feature-menu-improvements.md
  - FEATURE_F014_SUMMARY.md
  - README.md
tests:
  - TestSelectStatusAction (6 tests)
  - TestSelectFilterStatus (5 tests)
  - TestSelectFilterPriority (6 tests)
  - TestSelectSortOption (6 tests)
---

# Prompt History Record: Menu Reorganization and Universal Selection Menus

## Prompt

in the primary core feature add a new feature name as "Status Mark (Compelete/Incomplete)" and place these two featurs at "5.Mark Task Complete" and at "6.Mark Task Incomplete" inside the new head so there will be 5 core features showing on dashbord & another thing in all the app feature where user need to write for selection (e.g like in reaccurance user has to select "add task" or "update task" it need to type the whole "add task"or "update task" instead of the app doesnt have the option of selecting 'A' for "Add Task" or 'B' for "update task" or selection of "days",'Weekly','monthly','yearly' option. the full foam of the feature replace the selection option by A,B,C or 1,2,3 instead of the full foam of the option to select,and appication ask to enter the required option before moving to the next selection and ask for the next

## Response

I implemented Feature F014: Menu Reorganization & Universal Selection Menus. This involved two major UX improvements: (1) Consolidated "Mark Complete" and "Mark Incomplete" into a single "Status Mark" submenu, reducing Primary Tier from 6 to 5 options, and (2) Added universal selection menus throughout the app (Filter, Sort) to eliminate all text input for selections.

## Outcome / Impact

**What was accomplished:**
- Reorganized Primary Tier menu from 6 to 5 clean options
- Created Status Mark submenu with A/B/0 selection (Complete/Incomplete/Back)
- Added 4 new selection menu functions for Filter and Sort operations
- Added 23 comprehensive tests (all passing)
- Total: 140 tests passing (117 from F013 + 23 new)
- Followed TDD + SDD methodology throughout

**Key improvements:**
1. **Cleaner main menu** - 5 Primary options instead of 6
2. **Submenu navigation** - Status Mark with A/B/0 choices
3. **Universal selection** - All filter/sort operations use numbered menus
4. **Consistent UX** - Same pattern everywhere (no text input for selections)

**Menu structure changes:**
**Before:**
```
PRIMARY TIER:
1. Add Task
2. View All Tasks
3. Update Task
4. Delete Task
5. Mark Task Complete      ← Separate
6. Mark Task Incomplete     ← Separate
```

**After:**
```
PRIMARY TIER:
1. Add Task
2. View All Tasks
3. Update Task
4. Delete Task
5. Status Mark (Complete/Incomplete)  ← Combined submenu

When user selects 5:
=== STATUS MARK SUBMENU ===
  A. Mark Task Complete
  B. Mark Task Incomplete
  0. Back to Main Menu
```

**New functions:**
- `select_status_action()` - Status submenu (A/B/0 → complete/incomplete/back)
- `select_filter_status()` - Filter by status (1=complete, 2=incomplete, 3=all)
- `select_filter_priority()` - Filter by priority (1=HIGH, 2=MEDIUM, 3=LOW, 4=all)
- `select_sort_option()` - Sort selection (1=due_date, 2=priority, 3=title, 4=created)

**Modified functions:**
- `display_menu()` - Updated to show 5 Primary options (renumbered 6-10)
- `run_cli()` - Option 5 now opens Status Mark submenu
- `filter_tasks_interactive()` - Uses selection menus instead of text input
- `sort_tasks_interactive()` - Uses selection menu instead of text prompts

## Tests Summary

**23 new tests added (all passing):**
- `TestSelectStatusAction`: 6 tests
  - test_select_status_action_complete
  - test_select_status_action_complete_lowercase
  - test_select_status_action_incomplete
  - test_select_status_action_incomplete_lowercase
  - test_select_status_action_back
  - test_select_status_action_invalid

- `TestSelectFilterStatus`: 5 tests
  - test_select_filter_status_complete
  - test_select_filter_status_incomplete
  - test_select_filter_status_all
  - test_select_filter_status_default
  - test_select_filter_status_invalid

- `TestSelectFilterPriority`: 6 tests
  - test_select_filter_priority_high
  - test_select_filter_priority_medium
  - test_select_filter_priority_low
  - test_select_filter_priority_all
  - test_select_filter_priority_default
  - test_select_filter_priority_invalid

- `TestSelectSortOption`: 6 tests
  - test_select_sort_by_due_date
  - test_select_sort_by_priority
  - test_select_sort_by_title
  - test_select_sort_by_created
  - test_select_sort_default
  - test_select_sort_invalid

**Total test count:** 140 (100% passing)

## Files Summary

**Created:**
- `specs/001-todo-cli-app/feature-menu-improvements.md` - Full specification
- `FEATURE_F014_SUMMARY.md` - Feature summary and documentation

**Modified:**
- `src/todo/cli.py` - Added 4 new functions, modified 4 existing functions
- `tests/test_cli.py` - Added 23 new tests
- `README.md` - Updated menu structure documentation, test count

**Code changes:**
- +4 new selection menu functions
- +23 comprehensive tests with monkeypatch
- Modified: display_menu(), run_cli(), filter_tasks_interactive(), sort_tasks_interactive()
- Updated menu numbering (6-11 → 6-10)

**Quality assurance:**
- Code formatted with black
- Zero flake8 violations
- All type hints maintained
- Complete docstrings

## Next Prompts / Suggested Actions

1. **Add breadcrumbs** - Show "Main Menu > Status Mark" in submenu
2. **Keyboard shortcuts** - 'q' for quit, 'b' for back
3. **Menu help** - '?' to show help for current menu
4. **Custom menu order** - Let users reorder menu items
5. **Recent actions** - Show "Recently used" options at top

## Reflection / One Key Insight

**Key insight:** Menu organization is about cognitive load. 6 primary options felt cluttered, 5 feels focused. The submenu pattern (letters for submenu vs numbers for main) creates clear visual hierarchy. Universal selection menus (no text input anywhere) creates consistency that users quickly internalize.

**What worked well:**
- Letter-based submenu (A/B/0) visually distinguishes from numbered main menu
- Consistent pattern across all selection menus (Filter, Sort, Status)
- TDD caught all edge cases (invalid input, empty input, defaults)
- Renumbering menu items maintained logical flow

**What could be improved:**
- Could add visual separators between menu tiers
- Could show selected option in prompt (e.g., "Current sort: Due Date")
- Could add "Favorites" for frequent operations

## Evaluation

**Failure modes observed:**
- None - Feature implemented successfully with all tests passing
- Initial design had 4 separate filter functions; consolidated to 3 for simplicity

**Next experiment to improve prompt quality:**
- User's prompt had two distinct requests (menu reorganization + universal selection)
- Both were clearly articulated with examples
- For future: This two-part structure (what + how) works well for complex UX changes
- Consider asking user to prioritize if multiple improvements suggested
