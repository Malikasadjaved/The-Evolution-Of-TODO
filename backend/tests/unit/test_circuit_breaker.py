"""
Unit tests for CircuitBreaker utility.

Tests for:
- CircuitBreaker state transitions (CLOSED → OPEN → HALF_OPEN → CLOSED)
- Failure threshold tracking
- Recovery timeout behavior
- Call method success/failure handling

Constitution: .specify/memory/phase-3-constitution.md (v1.1.0)
Section XVI: Resilience & Error Handling

Circuit Breaker Pattern:
- CLOSED: Normal operation, calls pass through
- OPEN: Too many failures, calls fail fast without trying
- HALF_OPEN: Testing if service recovered, allow one test call
"""

import time
import pytest

from mcp.utils.circuit_breaker import CircuitBreaker, CircuitState


# ============================================================================
# CircuitBreaker Tests (T017)
# ============================================================================


def test_circuit_breaker_initial_state_closed():
    """
    Test CircuitBreaker starts in CLOSED state.

    Validates:
    - Initial state is CLOSED
    - Failure count is 0
    - Calls are allowed

    Constitution: Section XVI - Initial state
    """
    # Arrange & Act
    cb = CircuitBreaker(failure_threshold=3, recovery_timeout=5)

    # Assert
    assert cb.state == CircuitState.CLOSED
    assert cb.failure_count == 0


def test_circuit_breaker_success_keeps_closed():
    """
    Test successful calls keep circuit CLOSED.

    Validates:
    - Successful calls don't increment failure count
    - Circuit remains CLOSED after successful calls
    - Return value passed through correctly

    Constitution: Section XVI - Normal operation
    """
    # Arrange
    cb = CircuitBreaker(failure_threshold=3, recovery_timeout=5)

    def successful_operation():
        return "success"

    # Act
    result = cb.call(successful_operation)

    # Assert
    assert result == "success"
    assert cb.state == CircuitState.CLOSED
    assert cb.failure_count == 0


def test_circuit_breaker_opens_after_threshold():
    """
    Test circuit opens after failure threshold exceeded.

    Validates:
    - Circuit opens after N consecutive failures
    - Failure count tracked correctly
    - State transitions from CLOSED to OPEN

    Constitution: Section XVI - Failure threshold
    """
    # Arrange
    cb = CircuitBreaker(failure_threshold=3, recovery_timeout=5)

    def failing_operation():
        raise Exception("Service unavailable")

    # Act: Trigger 3 failures
    for _ in range(3):
        try:
            cb.call(failing_operation)
        except Exception:
            pass

    # Assert
    assert cb.state == CircuitState.OPEN
    assert cb.failure_count == 3


def test_circuit_breaker_fails_fast_when_open():
    """
    Test circuit breaker fails fast when OPEN.

    Validates:
    - Calls fail immediately without executing when OPEN
    - Exception raised indicates circuit is open
    - Underlying function not called (fail fast)

    Constitution: Section XVI - Fail fast pattern
    """
    # Arrange
    cb = CircuitBreaker(failure_threshold=2, recovery_timeout=5)
    call_count = 0

    def failing_operation():
        nonlocal call_count
        call_count += 1
        raise Exception("Service unavailable")

    # Open the circuit
    for _ in range(2):
        try:
            cb.call(failing_operation)
        except Exception:
            pass

    assert cb.state == CircuitState.OPEN
    call_count = 0  # Reset counter

    # Act: Try calling when circuit is OPEN
    with pytest.raises(Exception) as exc_info:
        cb.call(failing_operation)

    # Assert
    assert "Circuit breaker is OPEN" in str(exc_info.value)
    assert call_count == 0  # Function not called (fail fast)


def test_circuit_breaker_half_open_after_timeout():
    """
    Test circuit transitions to HALF_OPEN after recovery timeout.

    Validates:
    - Circuit transitions from OPEN to HALF_OPEN after timeout
    - One test call allowed in HALF_OPEN state
    - Timeout period configurable

    Constitution: Section XVI - Recovery timeout
    """
    # Arrange
    cb = CircuitBreaker(failure_threshold=2, recovery_timeout=1)  # 1 second timeout

    def failing_operation():
        raise Exception("Service unavailable")

    # Open the circuit
    for _ in range(2):
        try:
            cb.call(failing_operation)
        except Exception:
            pass

    assert cb.state == CircuitState.OPEN

    # Act: Wait for recovery timeout
    time.sleep(1.1)

    # Manually trigger state check by attempting a call
    def test_operation():
        return "testing"

    # Assert: Circuit should allow one test call (HALF_OPEN)
    # This will succeed and close the circuit
    result = cb.call(test_operation)
    assert result == "testing"
    assert cb.state == CircuitState.CLOSED


def test_circuit_breaker_closes_on_half_open_success():
    """
    Test circuit closes on successful call in HALF_OPEN state.

    Validates:
    - Successful test call in HALF_OPEN closes circuit
    - Failure count reset to 0
    - Circuit fully operational again

    Constitution: Section XVI - Recovery success
    """
    # Arrange
    cb = CircuitBreaker(failure_threshold=2, recovery_timeout=1)

    def failing_operation():
        raise Exception("Service unavailable")

    # Open the circuit
    for _ in range(2):
        try:
            cb.call(failing_operation)
        except Exception:
            pass

    assert cb.state == CircuitState.OPEN

    # Wait for recovery timeout
    time.sleep(1.1)

    # Act: Successful test call
    def successful_operation():
        return "recovered"

    result = cb.call(successful_operation)

    # Assert
    assert result == "recovered"
    assert cb.state == CircuitState.CLOSED
    assert cb.failure_count == 0


def test_circuit_breaker_reopens_on_half_open_failure():
    """
    Test circuit reopens on failed call in HALF_OPEN state.

    Validates:
    - Failed test call in HALF_OPEN reopens circuit
    - Circuit returns to OPEN state
    - New recovery timeout starts

    Constitution: Section XVI - Recovery failure
    """
    # Arrange
    cb = CircuitBreaker(failure_threshold=2, recovery_timeout=1)

    def failing_operation():
        raise Exception("Service unavailable")

    # Open the circuit
    for _ in range(2):
        try:
            cb.call(failing_operation)
        except Exception:
            pass

    assert cb.state == CircuitState.OPEN

    # Wait for recovery timeout
    time.sleep(1.1)

    # Act: Failed test call (should reopen circuit)
    try:
        cb.call(failing_operation)
    except Exception:
        pass

    # Assert
    assert cb.state == CircuitState.OPEN


def test_circuit_breaker_resets_count_on_success():
    """
    Test failure count resets on successful call.

    Validates:
    - Failure count resets to 0 after success
    - Prevents circuit from opening prematurely
    - Only consecutive failures trigger opening

    Constitution: Section XVI - Failure tracking
    """
    # Arrange
    cb = CircuitBreaker(failure_threshold=3, recovery_timeout=5)

    def failing_operation():
        raise Exception("Temporary failure")

    def successful_operation():
        return "success"

    # Act: 2 failures, then success, then 2 more failures
    try:
        cb.call(failing_operation)
    except Exception:
        pass

    try:
        cb.call(failing_operation)
    except Exception:
        pass

    assert cb.failure_count == 2

    # Success resets counter
    cb.call(successful_operation)
    assert cb.failure_count == 0
    assert cb.state == CircuitState.CLOSED

    # Two more failures shouldn't open circuit (need 3 consecutive)
    try:
        cb.call(failing_operation)
    except Exception:
        pass

    try:
        cb.call(failing_operation)
    except Exception:
        pass

    # Assert
    assert cb.state == CircuitState.CLOSED
    assert cb.failure_count == 2
