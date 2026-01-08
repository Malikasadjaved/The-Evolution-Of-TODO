# Windows Platform Compatibility Guide

Complete guide for resolving Windows-specific encoding and compatibility issues in Python applications.

## The Windows Encoding Problem

### Root Cause

Windows uses **CP1252 (Windows-1252)** encoding by default for console output, which cannot represent Unicode characters outside the Latin-1 range. This causes crashes when:

- Logging emoji characters (🚀, ✅, ❌, etc.)
- Printing Unicode symbols (→, •, ™, etc.)
- Displaying international characters (中文, العربية, etc.)

### Error Manifestations

**Error 1: UnicodeEncodeError**
```python
UnicodeEncodeError: 'charmap' codec can't encode character '\u2192' in position 614:
character maps to <undefined>
```

**Error 2: OSError (Errno 22)**
```python
OSError: [Errno 22] Invalid argument
```

**Error 3: Silent Failures**
- Characters replaced with `?`
- Output truncated
- Log files corrupted

## Solution 1: Force UTF-8 Encoding (Recommended)

### Global stdout/stderr Wrapper

**File**: `backend/utils/platform.py` or `backend/mcp/utils/logger.py`

```python
"""
Platform-specific initialization for cross-platform compatibility.
Call init_platform() at application startup.
"""

import sys
import io

def init_platform():
    """
    Initialize platform-specific configurations.
    Must be called before any print() or logging operations.
    """
    if sys.platform == "win32":
        # Force UTF-8 encoding for stdout and stderr on Windows
        sys.stdout = io.TextIOWrapper(
            sys.stdout.buffer,
            encoding='utf-8',
            errors='replace',  # Replace unencodable chars with '?'
            line_buffering=True
        )
        sys.stderr = io.TextIOWrapper(
            sys.stderr.buffer,
            encoding='utf-8',
            errors='replace',
            line_buffering=True
        )
        
        print("✅ Windows UTF-8 encoding enabled")
```

### Application Startup Integration

**File**: `backend/src/api/main.py` (FastAPI)

```python
from fastapi import FastAPI
from utils.platform import init_platform

# Initialize platform before creating app
init_platform()

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    logger.info("🚀 Application starting up")
```

**File**: `backend/mcp/server.py` (MCP Server)

```python
from mcp.server import Server
from utils.platform import init_platform

# Initialize platform at module level
init_platform()

server = Server("mcp-server")
```

**File**: `scripts/run.py` (Standalone Script)

```python
#!/usr/bin/env python3
from utils.platform import init_platform

if __name__ == "__main__":
    init_platform()
    # Rest of script
```

## Solution 2: Environment Variable (Python 3.7+)

### Set PYTHONIOENCODING

**Windows Command Prompt**:
```cmd
set PYTHONIOENCODING=utf-8
python main.py
```

**PowerShell**:
```powershell
$env:PYTHONIOENCODING="utf-8"
python main.py
```

**Permanent (System-wide)**:
1. Windows Search → "Environment Variables"
2. Add new variable: `PYTHONIOENCODING=utf-8`
3. Restart terminal

**Docker/Railway**:
```dockerfile
ENV PYTHONIOENCODING=utf-8
ENV PYTHONUTF8=1
```

**Railway Environment Variables**:
```bash
railway variables set PYTHONIOENCODING=utf-8
railway variables set PYTHONUTF8=1
```

## Solution 3: Sanitize Output (Fallback)

### Remove Non-ASCII Characters

```python
def sanitize_log_message(message: str) -> str:
    """
    Remove non-ASCII characters from log messages.
    Use as fallback when UTF-8 encoding not available.
    """
    return message.encode('ascii', errors='ignore').decode('ascii')

# Usage
import logging

class ASCIIFormatter(logging.Formatter):
    def format(self, record):
        record.msg = sanitize_log_message(str(record.msg))
        return super().format(record)

# Configure logger
handler = logging.StreamHandler()
handler.setFormatter(ASCIIFormatter())
logger.addHandler(handler)
```

### Emoji Replacement

```python
EMOJI_MAP = {
    "🚀": "[ROCKET]",
    "✅": "[CHECK]",
    "❌": "[X]",
    "⚠️": "[WARNING]",
    "📋": "[CLIPBOARD]",
    "🔍": "[SEARCH]",
}

def replace_emojis(text: str) -> str:
    """Replace emojis with ASCII equivalents"""
    for emoji, replacement in EMOJI_MAP.items():
        text = text.replace(emoji, replacement)
    return text

# Usage
logger.info(replace_emojis("🚀 Application started"))
# Output: "[ROCKET] Application started"
```

## Platform Detection Patterns

### Detect Windows Platform

```python
import sys
import platform

# Method 1: sys.platform
if sys.platform == "win32":
    # Windows (including 64-bit)
    pass

# Method 2: platform.system()
if platform.system() == "Windows":
    # Windows
    pass

# Method 3: os.name
import os
if os.name == "nt":
    # Windows
    pass
```

### Detect WSL (Windows Subsystem for Linux)

```python
import platform

def is_wsl() -> bool:
    """Check if running in WSL"""
    return "microsoft" in platform.uname().release.lower()

if is_wsl():
    # WSL environment (Linux kernel on Windows)
    # UTF-8 encoding works natively
    pass
```

### Cross-Platform Initialization

```python
import sys
import platform

def init_encoding():
    """Initialize encoding based on platform"""
    
    if sys.platform == "win32":
        # Native Windows (not WSL)
        import io
        sys.stdout = io.TextIOWrapper(
            sys.stdout.buffer,
            encoding='utf-8',
            errors='replace'
        )
        print("Windows UTF-8 encoding enabled")
    
    elif "microsoft" in platform.uname().release.lower():
        # WSL (already uses UTF-8)
        print("WSL detected, UTF-8 native")
    
    else:
        # Linux/Mac (already uses UTF-8)
        print(f"{platform.system()} detected, UTF-8 native")
```

## Logging Configuration for Windows

### Windows-Safe Logging Setup

```python
import logging
import sys
from logging.handlers import RotatingFileHandler

def setup_logging(log_level: str = "INFO"):
    """
    Configure logging with Windows UTF-8 support.
    """
    # Force UTF-8 for file handlers on Windows
    if sys.platform == "win32":
        file_handler = RotatingFileHandler(
            "app.log",
            maxBytes=10485760,  # 10MB
            backupCount=5,
            encoding='utf-8'  # Explicit UTF-8 for file
        )
    else:
        file_handler = RotatingFileHandler(
            "app.log",
            maxBytes=10485760,
            backupCount=5
        )
    
    # Console handler (uses sys.stdout which we already wrapped)
    console_handler = logging.StreamHandler(sys.stdout)
    
    # Format
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)
    
    # Root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    root_logger.addHandler(file_handler)
    root_logger.addHandler(console_handler)
    
    return root_logger

# Usage
logger = setup_logging()
logger.info("🚀 Application started")  # Works on Windows now
```

## Testing Windows Compatibility

### Test Script

```python
#!/usr/bin/env python3
"""
Test Windows encoding compatibility.
Run on Windows to verify UTF-8 encoding works.
"""

import sys
from utils.platform import init_platform

def test_encoding():
    """Test various Unicode characters"""
    
    test_cases = [
        ("Emoji", "🚀 ✅ ❌ ⚠️"),
        ("Arrows", "→ ← ↑ ↓"),
        ("Symbols", "• ™ © ®"),
        ("Chinese", "中文测试"),
        ("Arabic", "اختبار"),
        ("Cyrillic", "Тест"),
    ]
    
    print("="*50)
    print("Windows Encoding Test")
    print("="*50)
    print(f"Platform: {sys.platform}")
    print(f"Stdout encoding: {sys.stdout.encoding}")
    print("="*50)
    
    for name, text in test_cases:
        try:
            print(f"{name}: {text}")
            print(f"  ✅ Success")
        except Exception as e:
            print(f"  ❌ Failed: {e}")
    
    print("="*50)

if __name__ == "__main__":
    # Initialize platform
    init_platform()
    
    # Run tests
    test_encoding()
```

**Expected Output (Windows with UTF-8)**:
```
==================================================
Windows Encoding Test
==================================================
Platform: win32
Stdout encoding: utf-8
==================================================
Emoji: 🚀 ✅ ❌ ⚠️
  ✅ Success
Arrows: → ← ↑ ↓
  ✅ Success
...
```

## Common Pitfalls

### Pitfall 1: Wrapping stdout Too Late

```python
# ❌ WRONG: Print before wrapping
print("🚀 Starting...")  # Crash on Windows
init_platform()

# ✅ CORRECT: Wrap before any print
init_platform()
print("🚀 Starting...")  # Works on Windows
```

### Pitfall 2: Third-Party Libraries Printing Directly

```python
# Some libraries print directly without respecting sys.stdout wrapper

# Solution: Import and wrap BEFORE importing problematic libraries
from utils.platform import init_platform
init_platform()

# NOW import libraries that print
from some_library import verbose_function
```

### Pitfall 3: Subprocess Output

```python
# Subprocess output might still use CP1252

import subprocess

# ❌ WRONG: Default encoding
result = subprocess.run(["python", "script.py"], capture_output=True)
print(result.stdout)  # Might have encoding issues

# ✅ CORRECT: Explicit UTF-8
result = subprocess.run(
    ["python", "script.py"],
    capture_output=True,
    encoding='utf-8',  # Force UTF-8 for subprocess
    errors='replace'
)
print(result.stdout)
```

## Integration with FastAPI

### Startup Event

```python
from fastapi import FastAPI
from utils.platform import init_platform

# Must be called before creating app
init_platform()

app = FastAPI()

@app.on_event("startup")
async def startup():
    import logging
    logger = logging.getLogger("uvicorn")
    logger.info("🚀 FastAPI started")  # Works on Windows
```

### Middleware Logging

```python
from starlette.middleware.base import BaseHTTPMiddleware

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        # Log with emojis (works on Windows after init_platform)
        logger.info(f"📥 Request: {request.method} {request.url.path}")
        response = await call_next(request)
        logger.info(f"📤 Response: {response.status_code}")
        return response

app.add_middleware(LoggingMiddleware)
```

## WSL-Specific Notes

### WSL Already Uses UTF-8

```python
# WSL doesn't need stdout wrapping (Linux kernel)
if "microsoft" not in platform.uname().release.lower():
    # Native Windows only
    init_platform()
```

### Path Handling (WSL)

```python
# Windows paths from WSL
import os

def normalize_path(path: str) -> str:
    """Normalize path for cross-platform compatibility"""
    if sys.platform == "win32":
        # Windows: backslashes
        return path.replace("/", "\\")
    else:
        # Linux/WSL: forward slashes
        return path.replace("\\", "/")

# Usage
file_path = normalize_path("D:\\project\\file.txt")
# Windows: D:\project\file.txt
# WSL: D:/project/file.txt
```

## Deployment Considerations

### Railway/Cloud Deployment

Cloud platforms (Railway, Heroku, etc.) typically use Linux containers, which natively support UTF-8. The Windows fixes are only needed for:

- Local development on Windows
- Windows-based CI/CD runners
- Windows Server deployments

**Best Practice**: Always initialize platform compatibility, it's a no-op on Linux:

```python
from utils.platform import init_platform

# Safe to call on all platforms
init_platform()
```

### Docker on Windows

```dockerfile
FROM python:3.11-slim

# Force UTF-8 encoding
ENV PYTHONIOENCODING=utf-8
ENV PYTHONUTF8=1

WORKDIR /app
COPY . .

RUN pip install -r requirements.txt

CMD ["python", "main.py"]
```

## Summary Checklist

- [ ] Create `utils/platform.py` with `init_platform()` function
- [ ] Call `init_platform()` at application startup (before any prints)
- [ ] Set `PYTHONIOENCODING=utf-8` in environment (Railway, Docker)
- [ ] Use UTF-8 encoding for file handlers (`encoding='utf-8'`)
- [ ] Test on Windows with emojis and Unicode characters
- [ ] Consider emoji replacement as fallback for unsupported terminals
- [ ] Add platform detection logic (`sys.platform == "win32"`)
- [ ] Handle subprocess output with explicit UTF-8 encoding
