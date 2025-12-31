# mypy: ignore-errors
"""
StructuredLogger - Cloud-native JSON logging with PII protection.

Constitution: .specify/memory/phase-3-constitution.md (v1.1.0)
Section XVII: Observable Operations

Key Requirements:
- JSON output to stdout (12-factor app, cloud-native)
- PII protection (hash user_id, never log user content)
- Required fields: timestamp, level, event, message
- Log levels: DEBUG, INFO, WARNING, ERROR

Design:
- Stateless (no log file management)
- Output to stdout for container log aggregation
- Automatically redact sensitive fields
"""

import json
import sys
import hashlib
from datetime import datetime
from enum import Enum
from typing import Any, Dict

# Windows stdout encoding fix
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(
        sys.stdout.buffer,
        encoding="utf-8",
        errors="replace",
        newline=None,
        line_buffering=True
    )
    sys.stderr = io.TextIOWrapper(
        sys.stderr.buffer,
        encoding="utf-8",
        errors="replace",
        newline=None,
        line_buffering=True
    )


class LogLevel(str, Enum):
    """Log severity levels."""

    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"


# Sensitive fields that should be redacted
SENSITIVE_FIELDS = {
    "task_title",
    "task_description",
    "user_message",
    "message_content",
    "content",
    "password",
    "token",
    "secret",
    "api_key",
}


class StructuredLogger:
    """
    Cloud-native structured logger with PII protection.

    Features:
    - JSON output to stdout (not files)
    - PII protection (hash user identifiers)
    - Required fields: timestamp, level, event, message
    - Context fields for filtering/searching
    - Automatic redaction of sensitive content

    Usage:
        logger = StructuredLogger(service_name="mcp-server")
        logger.info(
            event="task_created",
            message="Task created successfully",
            user_id="user_123",
            task_id=42
        )

    Output:
        {
            "timestamp": "2025-12-25T18:30:00.000Z",
            "level": "INFO",
            "service": "mcp-server",
            "event": "task_created",
            "message": "Task created successfully",
            "user_id": "5f4dcc3b5aa765d61d8327deb882cf99",
            "task_id": 42
        }
    """

    def __init__(self, service_name: str):
        """
        Initialize StructuredLogger.

        Args:
            service_name: Name of the service (for multi-service environments)
        """
        self.service_name = service_name

    def debug(self, event: str, message: str, **context):
        """Log DEBUG level message."""
        self._log(LogLevel.DEBUG, event, message, context)

    def info(self, event: str, message: str, **context):
        """Log INFO level message."""
        self._log(LogLevel.INFO, event, message, context)

    def warning(self, event: str, message: str, **context):
        """Log WARNING level message."""
        self._log(LogLevel.WARNING, event, message, context)

    def error(self, event: str, message: str, **context):
        """Log ERROR level message."""
        self._log(LogLevel.ERROR, event, message, context)

    def _log(self, level: LogLevel, event: str, message: str, context: Dict[str, Any]):
        """
        Internal log method - builds and outputs JSON log entry.

        Args:
            level: Log severity level
            event: Event identifier (e.g., "task_created", "api_request")
            message: Human-readable message
            context: Additional context fields
        """
        # Build log entry with required fields
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": level.value,
            "service": self.service_name,
            "event": event,
            "message": message,
        }

        # Add context fields with PII protection
        protected_context = self._protect_pii(context)
        log_entry.update(protected_context)

        # Output to stdout as JSON (cloud-native, 12-factor app)
        json_output = json.dumps(log_entry)
        try:
            print(json_output, file=sys.stdout, flush=True)
        except (OSError, ValueError) as e:
            # Windows workaround: Invalid argument error when stdout is redirected
            # Fall back to standard print without file parameter
            sys.stdout.write(json_output + "\n")
            sys.stdout.flush()

    def _protect_pii(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Protect PII in context fields.

        PII Protection Rules:
        1. user_id: Hash with SHA256 (consistent masking)
        2. Sensitive fields: Redact entirely
        3. Other fields: Pass through

        Args:
            context: Raw context dictionary

        Returns:
            Protected context dictionary
        """
        protected = {}

        for key, value in context.items():
            # Hash user identifiers
            if key == "user_id" and isinstance(value, str):
                protected[key] = self._hash_user_id(value)

            # Redact sensitive content
            elif key in SENSITIVE_FIELDS:
                protected[key] = "[REDACTED]"

            # Pass through non-sensitive fields
            else:
                protected[key] = value

        return protected

    def _hash_user_id(self, user_id: str) -> str:
        """
        Hash user_id for PII protection.

        Uses SHA256 for consistent, non-reversible masking.
        Same user_id → same hash (useful for tracking user patterns).

        Args:
            user_id: Original user identifier

        Returns:
            Hashed user identifier (hex string)
        """
        return hashlib.sha256(user_id.encode("utf-8")).hexdigest()[:16]
