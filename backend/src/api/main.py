"""
FastAPI application initialization.

This is the main entry point for the backend API.
"""

from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings

# Create FastAPI application
app = FastAPI(
    title="Todo App API - Phase 2",
    description="Full-stack todo application with JWT authentication and user isolation",
    version="2.0.0",
    docs_url="/docs",  # Swagger UI at /docs
    redoc_url="/redoc",  # ReDoc at /redoc
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],  # Allow frontend origin
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.get("/health")
async def health_check() -> dict:
    """
    Health check endpoint (no authentication required).

    Returns:
        dict: Health status and current timestamp

    Example response:
        {
            "status": "healthy",
            "timestamp": "2025-12-16T00:00:00.000000"
        }
    """
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


# Mount routers
from .routes import tasks, tags

app.include_router(tasks.router, tags=["tasks"])
app.include_router(tags.router, tags=["tags"])
