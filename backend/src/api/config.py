"""
Configuration module with Pydantic Settings validation.

Environment variables are validated on application startup.
If validation fails, the application will not start.
"""

from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with validation."""

    # Authentication (CRITICAL: Must be at least 32 characters)
    better_auth_secret: str

    # Database
    database_url: str

    # API Server (Phase 3 T022: Kubernetes-ready)
    host: str = "0.0.0.0"  # Bind to all interfaces (not 127.0.0.1)
    port: int = 8000  # Can be overridden via PORT env variable

    # CORS (comma-separated list for multiple frontends)
    frontend_url: str = "http://localhost:3000,http://localhost:3001"

    # Debug mode (show detailed errors in responses)
    debug: bool = True  # Temporarily True for debugging

    # Phase 3: OpenAI API key for Agents SDK
    openai_api_key: str = ""  # Optional for tests, required for production

    @field_validator("better_auth_secret")
    @classmethod
    def validate_secret_length(cls, v: str) -> str:
        """Validate BETTER_AUTH_SECRET is at least 32 characters."""
        if len(v) < 32:
            raise ValueError(
                f"BETTER_AUTH_SECRET must be at least 32 characters. "
                f"Current length: {len(v)}. "
                f'Generate with: python -c "import secrets; print(secrets.token_urlsafe(32))"'
            )
        return v

    @field_validator("database_url")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        """Validate DATABASE_URL is a valid connection string."""
        if not (v.startswith("postgresql://") or v.startswith("sqlite:///")):
            raise ValueError(
                "DATABASE_URL must be a valid database connection string. "
                "Supported: postgresql:// or sqlite:///"
            )
        return v

    class Config:
        """Pydantic configuration."""

        env_file = ".env"
        case_sensitive = False


# Initialize settings (validates on import)
settings = Settings()  # type: ignore[call-arg]
