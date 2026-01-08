"""
Application Configuration with Pydantic Settings

Loads environment variables and provides type-safe settings.

Usage:
    from .config import settings

    # Access settings
    database_url = settings.database_url
    jwt_secret = settings.better_auth_secret
"""

from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.

    Environment variables:
        DATABASE_URL: PostgreSQL connection string
        BETTER_AUTH_SECRET: JWT signing secret (43 characters)
        BETTER_AUTH_URL: Better Auth endpoint URL
        FRONTEND_URL: Comma-separated frontend origins for CORS
        OPENAI_API_KEY: Optional OpenAI API key
        HOST: Server host (default: 0.0.0.0)
        PORT: Server port (default: 8000)

    Example .env file:
        DATABASE_URL=postgresql://user:pass@host.neon.tech/db?sslmode=require
        BETTER_AUTH_SECRET=your-43-character-secret-here
        BETTER_AUTH_URL=https://frontend.vercel.app/api/auth
        FRONTEND_URL=http://localhost:3000,https://frontend.vercel.app
        OPENAI_API_KEY=sk-...
        HOST=0.0.0.0
        PORT=8000
    """

    # Database
    database_url: str

    # Authentication (Better Auth + JWT)
    better_auth_secret: str
    better_auth_url: str = "http://localhost:3000/api/auth"

    # CORS (comma-separated frontend URLs)
    frontend_url: str = "http://localhost:3000"

    # Optional: AI features
    openai_api_key: str = ""

    # Server configuration
    host: str = "0.0.0.0"
    port: int = 8000

    # Environment
    environment: str = "development"  # development, staging, production

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Global settings instance
settings = Settings()


def get_frontend_origins() -> list[str]:
    """
    Parse comma-separated frontend URLs for CORS.

    Returns:
        list[str]: List of allowed frontend origins

    Example:
        # FRONTEND_URL="http://localhost:3000,https://app.vercel.app"
        origins = get_frontend_origins()
        # ["http://localhost:3000", "https://app.vercel.app"]
    """
    return [url.strip() for url in settings.frontend_url.split(",")]
