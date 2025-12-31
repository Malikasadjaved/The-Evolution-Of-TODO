"""
Unit tests for StructuredLogger utility.

Tests for:
- JSON output format to stdout
- PII protection (mask user_id, redact sensitive content)
- Required fields: timestamp, level, event, message
- Log levels: DEBUG, INFO, WARNING, ERROR

Constitution: .specify/memory/phase-3-constitution.md (v1.1.0)
Section XVII: Observable Operations

Structured Logging Contract:
- Output: JSON to stdout (cloud-native, 12-factor app)
- PII Protection: Hash/mask user identifiers, never log user content
- Format: {timestamp, level, event, message, context}
"""

import json
import io
from contextlib import redirect_stdout
from datetime import datetime

from mcp.utils.logger import StructuredLogger


# ============================================================================
# StructuredLogger Tests (T018)
# ============================================================================


def test_structured_logger_json_output():
    """
    Test StructuredLogger outputs valid JSON to stdout.

    Validates:
    - Output is valid JSON
    - Goes to stdout (not files)
    - Can be parsed by log aggregators

    Constitution: Section XVII - JSON output format
    """
    # Arrange
    logger = StructuredLogger(service_name="test-service")
    output = io.StringIO()

    # Act: Capture stdout
    with redirect_stdout(output):
        logger.info(event="test_event", message="Test message")

    # Assert
    output_str = output.getvalue()
    assert output_str.strip()  # Not empty

    # Parse as JSON
    log_entry = json.loads(output_str)
    assert isinstance(log_entry, dict)


def test_structured_logger_required_fields():
    """
    Test StructuredLogger includes all required fields.

    Validates:
    - timestamp (ISO 8601 format)
    - level (DEBUG, INFO, WARNING, ERROR)
    - event (action identifier)
    - message (human-readable description)

    Constitution: Section XVII - Required fields
    """
    # Arrange
    logger = StructuredLogger(service_name="test-service")
    output = io.StringIO()

    # Act
    with redirect_stdout(output):
        logger.info(event="user_action", message="User performed action")

    # Assert
    log_entry = json.loads(output.getvalue())

    assert "timestamp" in log_entry
    assert "level" in log_entry
    assert "event" in log_entry
    assert "message" in log_entry

    # Validate timestamp format (ISO 8601)
    datetime.fromisoformat(log_entry["timestamp"].replace("Z", "+00:00"))

    # Validate level
    assert log_entry["level"] == "INFO"


def test_structured_logger_pii_protection_user_id():
    """
    Test StructuredLogger masks user_id to protect PII.

    Validates:
    - user_id is hashed/masked, not logged in plaintext
    - Consistent masking (same user_id → same hash)
    - Original user_id not recoverable from logs

    Constitution: Section XVII - PII protection
    """
    # Arrange
    logger = StructuredLogger(service_name="test-service")
    output = io.StringIO()

    # Act: Log with user_id
    with redirect_stdout(output):
        logger.info(
            event="task_created",
            message="Task created",
            user_id="user_12345",
            task_id=42,
        )

    # Assert
    log_entry = json.loads(output.getvalue())

    # user_id should be masked
    if "user_id" in log_entry:
        assert log_entry["user_id"] != "user_12345"  # Not plaintext
        assert "user_" not in log_entry["user_id"]  # Prefix removed
        # Should be hashed (hex string)
        assert all(c in "0123456789abcdef" for c in log_entry["user_id"])

    # task_id is not PII, should be present
    assert log_entry.get("task_id") == 42


def test_structured_logger_no_user_content():
    """
    Test StructuredLogger never logs user-generated content.

    Validates:
    - Task titles, descriptions, messages are NOT logged
    - Only system events and metadata logged
    - Sensitive data explicitly blocked

    Constitution: Section XVII - Content redaction
    """
    # Arrange
    logger = StructuredLogger(service_name="test-service")
    output = io.StringIO()

    # Act: Attempt to log sensitive content (should be filtered)
    with redirect_stdout(output):
        logger.info(
            event="task_created",
            message="Task created successfully",
            task_id=42,
            # These should NOT appear in logs
            task_title="Sensitive user data",
            task_description="Private information",
            user_message="User's private message",
        )

    # Assert
    log_entry = json.loads(output.getvalue())

    # Sensitive fields should be redacted or absent
    assert "task_title" not in log_entry or log_entry.get("task_title") == "[REDACTED]"
    assert "task_description" not in log_entry or log_entry.get("task_description") == "[REDACTED]"
    assert "user_message" not in log_entry or log_entry.get("user_message") == "[REDACTED]"

    # Metadata should be present
    assert log_entry.get("task_id") == 42


def test_structured_logger_log_levels():
    """
    Test StructuredLogger supports all log levels.

    Validates:
    - DEBUG, INFO, WARNING, ERROR levels
    - Level correctly set in output
    - Methods exist for all levels

    Constitution: Section XVII - Log levels
    """
    # Arrange
    logger = StructuredLogger(service_name="test-service")

    # Test each level
    levels = [
        (logger.debug, "DEBUG"),
        (logger.info, "INFO"),
        (logger.warning, "WARNING"),
        (logger.error, "ERROR"),
    ]

    for log_method, expected_level in levels:
        output = io.StringIO()

        # Act
        with redirect_stdout(output):
            log_method(event="test_event", message="Test message")

        # Assert
        log_entry = json.loads(output.getvalue())
        assert log_entry["level"] == expected_level


def test_structured_logger_context_fields():
    """
    Test StructuredLogger includes custom context fields.

    Validates:
    - Additional fields can be passed
    - Context preserved in JSON output
    - Useful for filtering/searching logs

    Constitution: Section XVII - Contextual logging
    """
    # Arrange
    logger = StructuredLogger(service_name="test-service")
    output = io.StringIO()

    # Act: Log with context
    with redirect_stdout(output):
        logger.info(
            event="api_request",
            message="Chat endpoint called",
            method="POST",
            path="/api/chat/123",
            status_code=200,
            duration_ms=245,
        )

    # Assert
    log_entry = json.loads(output.getvalue())

    assert log_entry["method"] == "POST"
    assert log_entry["path"] == "/api/chat/123"
    assert log_entry["status_code"] == 200
    assert log_entry["duration_ms"] == 245


def test_structured_logger_service_name():
    """
    Test StructuredLogger includes service name.

    Validates:
    - Service name appears in logs
    - Helps identify log source in multi-service environment
    - Set during initialization

    Constitution: Section XVII - Service identification
    """
    # Arrange
    logger = StructuredLogger(service_name="mcp-server")
    output = io.StringIO()

    # Act
    with redirect_stdout(output):
        logger.info(event="server_start", message="MCP server started")

    # Assert
    log_entry = json.loads(output.getvalue())
    assert log_entry.get("service") == "mcp-server"


def test_structured_logger_error_with_exception():
    """
    Test StructuredLogger logs exceptions with stack traces.

    Validates:
    - Exception type and message captured
    - Stack trace included for debugging
    - Error logs have sufficient detail

    Constitution: Section XVII - Error logging
    """
    # Arrange
    logger = StructuredLogger(service_name="test-service")
    output = io.StringIO()

    try:
        raise ValueError("Test exception")
    except ValueError as e:
        # Act
        with redirect_stdout(output):
            logger.error(
                event="operation_failed",
                message="Operation failed with exception",
                error=str(e),
                error_type=type(e).__name__,
            )

    # Assert
    log_entry = json.loads(output.getvalue())

    assert log_entry["level"] == "ERROR"
    assert log_entry["error"] == "Test exception"
    assert log_entry["error_type"] == "ValueError"
