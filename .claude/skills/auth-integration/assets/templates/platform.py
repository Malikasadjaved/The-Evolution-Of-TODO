"""
Platform-specific initialization for cross-platform compatibility.

Fixes Windows encoding issues (Errno 22, UnicodeEncodeError) by forcing UTF-8.

Usage:
    from utils.platform import init_platform

    # Call at application startup (before any print/logging)
    init_platform()

    # Now safe to use emojis and Unicode
    print("🚀 Application started")
"""

import io
import sys


def init_platform():
    """
    Initialize platform-specific configurations.

    Must be called at application startup, before any print() or logging operations.

    Fixes:
        - Windows Errno 22 (Invalid argument)
        - Windows UnicodeEncodeError (charmap codec can't encode character)

    Example:
        # In main.py or server.py
        from utils.platform import init_platform

        init_platform()  # Call before creating FastAPI app

        app = FastAPI()

        @app.on_event("startup")
        async def startup():
            logger.info("🚀 App started")  # Now works on Windows
    """
    if sys.platform == "win32":
        # Force UTF-8 encoding for stdout and stderr on Windows
        sys.stdout = io.TextIOWrapper(
            sys.stdout.buffer,
            encoding="utf-8",
            errors="replace",  # Replace unencodable chars with '?'
            line_buffering=True,
        )
        sys.stderr = io.TextIOWrapper(
            sys.stderr.buffer, encoding="utf-8", errors="replace", line_buffering=True
        )

        print("✅ Windows UTF-8 encoding enabled")


def is_wsl() -> bool:
    """
    Check if running in WSL (Windows Subsystem for Linux).

    Returns:
        bool: True if running in WSL, False otherwise

    Example:
        if is_wsl():
            print("Running in WSL")
        elif sys.platform == "win32":
            print("Running on native Windows")
        else:
            print("Running on Linux/Mac")
    """
    import platform

    return "microsoft" in platform.uname().release.lower()


def get_platform_name() -> str:
    """
    Get human-readable platform name.

    Returns:
        str: "Windows", "WSL", "Linux", "macOS", or "Unknown"

    Example:
        print(f"Running on {get_platform_name()}")
    """
    import platform

    if sys.platform == "win32":
        return "Windows"
    elif is_wsl():
        return "WSL"
    elif sys.platform == "linux":
        return "Linux"
    elif sys.platform == "darwin":
        return "macOS"
    else:
        return "Unknown"
