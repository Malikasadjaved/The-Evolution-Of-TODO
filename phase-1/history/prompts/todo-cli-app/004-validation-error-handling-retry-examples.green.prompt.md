---
id: 004
title: Validation Error Handling with Retry & Examples
stage: green
date: 2025-12-06
surface: agent
model: claude-sonnet-4-5
feature: todo-cli-app
branch: main
user: Malikasadjaved
command: /sp.phr
labels: ["validation", "error-handling", "retry", "ux", "tdd", "feature-f015"]
links:
  spec: specs/001-todo-cli-app/feature-validation-retry.md
  ticket: null
  adr: null
  pr: null
files:
  - src/todo/cli.py
  - tests/test_cli.py
  - specs/001-todo-cli-app/feature-validation-retry.md
  - FEATURE_F015_SUMMARY.md
tests:
  - TestAskRetry (4 tests)
  - TestGetDateInputWithRetry (4 tests)
  - TestGetTaskIdWithRetry (5 tests)
  - TestGetTitleWithRetry (5 tests)
---

# Prompt History Record: Validation Error Handling with Retry & Examples

## Prompt

in the app add another feature when the user skip to add somthing which is not releted to the feature and the validation error accure ask him if the user to retry and add data for validation and also give example which data that the user can add again the data in the correct foam

## Response

I implemented Feature F015: Smart Validation Error Handling with Retry & Examples. When users make validation errors (invalid date, invalid task ID, empty title), the app now shows clear error messages with helpful examples and asks if they want to retry. This prevents data loss and provides a professional, forgiving user experience.

## Outcome / Impact

**What was accomplished:**
- Created 4 new validation functions with intelligent retry logic
- Enhanced 5 interactive functions (Add, Update, Delete, Mark Complete, Mark Incomplete)
- Added 18 comprehensive tests (all passing)
- Total: 158 tests passing (140 previous + 18 new)
- Followed TDD + SDD methodology throughout

**Key improvements:**
1. **No data loss** - Users don't lose progress on validation errors
2. **Helpful examples** - Clear guidance on correct format (e.g., "2025-12-31 or 2025-12-31 14:30")
3. **Graceful recovery** - Retry without restarting entire process
4. **Professional UX** - ❌ error icons, ✓ success icons, color-coded messages

**New functions:**
- `ask_retry(field_name, example)` - Generic retry prompt with examples
- `get_date_input_with_retry(prompt)` - Date validation with retry
- `get_task_id_with_retry(prompt)` - Task ID validation (positive integers only)
- `get_title_with_retry()` - Required field validation (non-empty title)

**Validation coverage:**
- Invalid date format → Example: "2025-12-31 or 2025-12-31 14:30"
- Invalid task ID (text, negative, zero) → Example: "1, 2, 3, etc."
- Empty title → Example: "'Complete project report' or 'Buy groceries'"
- Whitespace-only input → Retry with actual content

## Tests Summary

**18 new tests added (all passing):**
- `TestAskRetry`: 4 tests
  - test_ask_retry_yes
  - test_ask_retry_yes_short
  - test_ask_retry_no
  - test_ask_retry_empty_default_no

- `TestGetDateInputWithRetry`: 4 tests
  - test_date_input_valid_first_try
  - test_date_input_retry_success
  - test_date_input_retry_cancel
  - test_date_input_empty_skip

- `TestGetTaskIdWithRetry`: 5 tests
  - test_task_id_valid_first_try
  - test_task_id_retry_success
  - test_task_id_retry_cancel
  - test_task_id_negative_retry
  - test_task_id_zero_retry

- `TestGetTitleWithRetry`: 5 tests
  - test_title_valid_first_try
  - test_title_retry_success
  - test_title_retry_cancel
  - test_title_whitespace_only_retry
  - test_title_strips_whitespace

**Total test count:** 158 (100% passing)

## Files Summary

**Created:**
- `specs/001-todo-cli-app/feature-validation-retry.md` - Full specification
- `FEATURE_F015_SUMMARY.md` - Feature summary and documentation
- `history/prompts/todo-cli-app/004-validation-error-handling-retry-examples.green.prompt.md` - This PHR

**Modified:**
- `src/todo/cli.py` - Added 4 new functions, modified 5 interactive functions
- `tests/test_cli.py` - Added 18 comprehensive tests
- `README.md` - Updated test count (158), feature count (15)

**Code changes:**
- +4 new validation functions with retry logic
- +18 comprehensive tests with monkeypatch for input mocking
- +1 import (datetime)
- Modified: add_task_interactive(), update_task_interactive(), delete_task_interactive(), mark_complete_interactive(), mark_incomplete_interactive()

**Quality assurance:**
- Code formatted with black
- Zero flake8 violations
- Fixed 2 line length issues (E501)
- All type hints maintained
- Complete docstrings

## Next Prompts / Suggested Actions

1. **Test the retry functionality manually** - Run `python main.py` and intentionally enter invalid data to experience the new retry flow
2. **Consider additional validations** - Could add retry for tags format (comma-separated), reminder offset (numeric)
3. **Color-coded examples** - Enhance examples with green highlighting for valid format
4. **Track retry attempts** - Show "Attempt 2 of 3" for user awareness
5. **Update DEPLOYMENT.md** - Add section about validation error handling in user guide
6. **Create demo video** - Show before/after comparison of validation handling

## Reflection / One Key Insight

**Key insight:** Validation errors are learning opportunities, not punishments. By providing immediate, helpful examples and allowing retry, we transformed frustrating error messages into a teaching moment. The pattern "Error → Example → Retry" is universally applicable and dramatically improves UX.

**What worked well:**
- TDD approach caught edge cases early (negative IDs, whitespace-only titles)
- Monkeypatch in pytest perfectly simulated user input sequences
- Consistent retry pattern across all validation types
- Cancel-friendly design (defaults to "no") prevents infinite loops

**What could be improved:**
- Could add keyboard shortcuts (Ctrl+R to retry)
- Could show number of retry attempts
- Could add "Learn more" links to documentation

## Evaluation

**Failure modes observed:**
- None - Feature implemented successfully with all tests passing on first run after implementation
- Initial PHR creation via bash script failed (script not found), successfully fell back to agent-native approach

**Next experiment to improve prompt quality:**
- The user's original prompt was clear and specific, identifying the exact pain point (validation errors without retry)
- For future prompts: Continue this level of specificity about UX problems to solve
- Consider asking for examples upfront to validate understanding before implementation
