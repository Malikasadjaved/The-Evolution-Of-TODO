# Skill: auth_integration

**Purpose**: Implements a production-hardened, cross-platform authentication and authorization system using JWT, designed to resolve Windows-specific encoding failures and PostgreSQL schema mismatches.

## 📋 Capability Summary
This skill automates the configuration of the "Stateless JWT Auth Flow" while proactively resolving common pitfalls found in monorepo development on Windows.

## 🛠️ Implementation Requirements

### 1. Robust Middleware (`backend/src/api/auth.py`)
- **Extraction**: Extract `Bearer` token from the `Authorization` header.
- **Verification**: Use `PyJWT` to verify signature with `BETTER_AUTH_SECRET`.
- **User Context**: Extract `user_id` and provide it as a FastAPI dependency.
- **Exclusion**: Allow open access to `/health`, `/ready`, and `/api/auth/sign-in|sign-up`.

### 2. Cross-Platform Stability (Windows Fix)
- **UTF-8 Override**: In `mcp/utils/logger.py`, detect `sys.platform == "win32"` and force `sys.stdout` to use `utf-8` to prevent `[Errno 22] Invalid argument` when logging emojis.
- **Emoji Sanitization**: Remove high-frequency non-ASCII characters from main request/response logging middleware.

### 3. Database & Schema Alignment
- **Timestamp Integrity**: Ensure all Python models use `datetime.utcnow()` when inserting into `TIMESTAMP` columns. NEVER use `int(time.time())` for database timestamps as it causes `psycopg.errors.CannotCoerce`.

### 4. Global Authorization Patterns
- **User Isolation**: Every database query MUST include `.where(Model.user_id == current_user_id)` using the verified ID from the JWT.
- **CORS Strategy**: Support multi-origin comma-separated frontend URLs in `settings.frontend_url`.

## 🚨 Error Taxonomy handled by this skill:
| Status | Error Detail | Resolution Pattern |
|--------|--------------|-------------------|
| 401 | `Unauthorized` | Triggered by missing or expired JWT |
| 403 | `Forbidden` | User Context mismatch (URL user != Token user) |
| 500 | `[Errno 22]` | Windows stdout encoding mismatch (Fixed by UTF-8 forcing) |
| 500 | `CannotCoerce` | Schema type mismatch (Fixed by `datetime` enforcement) |

## 🚀 Usage Pattern
`"Create the auth_integration agent to harden the API and fix Windows encoding issues"`
`"Use the auth_integration skill to generate the JWT middleware and shared database models"`

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)
