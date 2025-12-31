# mypy: ignore-errors
"""
CircuitBreaker - Protects against cascading failures to external services.

Constitution: .specify/memory/phase-3-constitution.md (v1.1.0)
Section XVI: Resilience & Error Handling

Circuit Breaker Pattern:
- CLOSED: Normal operation, requests pass through
- OPEN: Too many failures, fail fast without trying
- HALF_OPEN: Testing recovery, allow one test request

Key Behaviors:
- Track consecutive failures
- Open circuit when threshold exceeded
- Automatic recovery attempt after timeout
- Fail fast when circuit is OPEN (no cascading failures)

Note: In-memory state is ACCEPTABLE for CircuitBreaker as it's per-server instance.
This is an exception to the statelessness principle - circuit state is operational,
not business data.
"""

from enum import Enum
from typing import Callable, Any
import time


class CircuitState(str, Enum):
    """Circuit breaker states."""

    CLOSED = "CLOSED"  # Normal operation
    OPEN = "OPEN"  # Failing, reject calls
    HALF_OPEN = "HALF_OPEN"  # Testing recovery


class CircuitBreaker:
    """
    Circuit breaker for protecting against cascading failures.

    Design Notes:
    - In-memory state per server instance (acceptable for operational data)
    - Not synchronized across servers (each server has its own circuit)
    - Resets on server restart (acceptable - operational state)

    Usage:
        cb = CircuitBreaker(failure_threshold=5, recovery_timeout=60)

        def risky_operation():
            return external_api_call()

        result = cb.call(risky_operation)
    """

    def __init__(self, failure_threshold: int = 5, recovery_timeout: int = 60):
        """
        Initialize CircuitBreaker.

        Args:
            failure_threshold: Number of consecutive failures before opening circuit
            recovery_timeout: Seconds to wait before attempting recovery (HALF_OPEN)
        """
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout

        # State tracking (in-memory, per-server instance)
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.last_failure_time: float = 0.0

    def call(self, func: Callable, *args, **kwargs) -> Any:
        """
        Execute function with circuit breaker protection.

        State Transitions:
        - CLOSED → OPEN: After failure_threshold consecutive failures
        - OPEN → HALF_OPEN: After recovery_timeout seconds
        - HALF_OPEN → CLOSED: On successful call
        - HALF_OPEN → OPEN: On failed call

        Args:
            func: Function to execute
            *args: Positional arguments for func
            **kwargs: Keyword arguments for func

        Returns:
            Result of func() if successful

        Raises:
            Exception: If circuit is OPEN or func raises exception
        """
        # Check if we should transition from OPEN to HALF_OPEN
        if self.state == CircuitState.OPEN:
            if self._should_attempt_reset():
                self.state = CircuitState.HALF_OPEN
            else:
                # Fail fast - don't even try
                raise Exception(
                    f"Circuit breaker is OPEN. Service unavailable. "
                    f"Retry after {self._time_until_retry():.1f} seconds."
                )

        # Attempt the call
        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result

        except Exception as e:
            self._on_failure()
            raise e

    def _on_success(self):
        """Handle successful call - reset failure count and close circuit."""
        self.failure_count = 0

        if self.state == CircuitState.HALF_OPEN:
            # Recovery successful, close circuit
            self.state = CircuitState.CLOSED

    def _on_failure(self):
        """Handle failed call - increment count and potentially open circuit."""
        self.failure_count += 1
        self.last_failure_time = time.time()

        if self.state == CircuitState.HALF_OPEN:
            # Recovery failed, reopen circuit
            self.state = CircuitState.OPEN

        elif self.failure_count >= self.failure_threshold:
            # Threshold exceeded, open circuit
            self.state = CircuitState.OPEN

    def _should_attempt_reset(self) -> bool:
        """
        Check if enough time has passed to attempt recovery.

        Returns:
            True if recovery_timeout has elapsed since last failure
        """
        if self.last_failure_time == 0.0:
            return False

        elapsed = time.time() - self.last_failure_time
        return elapsed >= self.recovery_timeout

    def _time_until_retry(self) -> float:
        """
        Calculate time remaining until recovery attempt.

        Returns:
            Seconds until circuit attempts HALF_OPEN state
        """
        if self.last_failure_time == 0.0:
            return 0.0

        elapsed = time.time() - self.last_failure_time
        return max(0.0, self.recovery_timeout - elapsed)

    def reset(self):
        """
        Manually reset circuit breaker to CLOSED state.

        Use case: Administrative recovery, testing
        """
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.last_failure_time = 0.0
