# mypy: ignore-errors
"""
FastAPI application initialization.

This is the main entry point for the backend API.
"""

import logging
import time
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Callable

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .db import create_tables, engine
from .routes import auth, tags, tasks, chat

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),  # Console output
    ],
)
logger = logging.getLogger(__name__)


# Lifespan context manager for startup and shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for graceful startup and shutdown.

    Startup:
    - Initialize database tables
    - Log server start

    Shutdown:
    - Wait for active requests to complete (max 30s)
    - Close database connections
    - Log graceful shutdown

    Constitution: Section XIV - Cloud-Native Architecture
    Phase 3 requirement: T021
    """
    # Startup
    logger.info("Server starting up...")
    create_tables()
    logger.info("Database tables initialized")
    logger.info(f"Server ready on http://{settings.host}:{settings.port}")

    yield  # Server is running

    # Shutdown
    logger.info("Server shutting down gracefully...")
    logger.info("Waiting for active requests to complete (max 30s)...")

    # Note: FastAPI automatically waits for active requests
    # We just need to close database connections

    try:
        engine.dispose()
        logger.info("Database connections closed")
    except Exception as e:
        logger.error(f"Error closing database connections: {e}")

    logger.info("Graceful shutdown complete")


# Create FastAPI application with lifespan
app = FastAPI(
    title="Todo App API - Phase 2 & 3",
    description="Full-stack todo application with JWT authentication, user isolation, and AI chatbot",
    version="3.0.0",
    docs_url="/docs",  # Swagger UI at /docs
    redoc_url="/redoc",  # ReDoc at /redoc
    lifespan=lifespan,  # Graceful shutdown handler
)

# Configure CORS
# Parse comma-separated frontend URLs
frontend_origins = [url.strip() for url in settings.frontend_url.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,  # Allow multiple frontend origins
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


# Request/Response Logging Middleware
@app.middleware("http")
async def log_requests(request: Request, call_next: Callable) -> Response:
    """
    Log all incoming requests and outgoing responses.

    Logs:
    - Request method, URL, client IP
    - Response status code, processing time
    - Errors and exceptions

    Example log:
        INFO - GET /api/user123/tasks from 127.0.0.1 - 200 OK (0.123s)
    """
    start_time = time.time()
    client_ip = request.client.host if request.client else "unknown"

    # Log incoming request
    logger.info(f"{request.method} {request.url.path} from {client_ip}")

    try:
        # Process request
        response = await call_next(request)

        # Calculate processing time
        process_time = time.time() - start_time

        # Log successful response
        logger.info(
            f"{request.method} {request.url.path} - {response.status_code} "
            f"({process_time:.3f}s)"
        )

        # Add custom header with processing time
        response.headers["X-Process-Time"] = str(process_time)

        return response

    except Exception as e:
        # Calculate processing time
        process_time = time.time() - start_time

        # Log error
        logger.error(
            f"{request.method} {request.url.path} - ERROR: {str(e)} ({process_time:.3f}s)",
            exc_info=True,
        )

        # Return 500 Internal Server Error
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Internal server error",
                "error": str(e) if settings.debug else "An unexpected error occurred",
            },
        )


# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Catch-all exception handler for unhandled errors.

    Returns:
        JSONResponse with 500 status code and error details
    """
    logger.error(
        f"Unhandled exception on {request.method} {request.url.path}: {str(exc)}",
        exc_info=True,
    )

    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "error": str(exc) if settings.debug else "An unexpected error occurred",
        },
    )


@app.get("/health")
async def health_check() -> dict:
    """
    Liveness probe endpoint (no authentication required).

    Fast check (< 500ms) to verify server is running.
    NO external dependency checks (DB, OpenAI, etc.).

    Kubernetes liveness probe uses this endpoint.
    If this fails, container is restarted.

    Constitution: Section XIV - Cloud-Native Architecture
    Phase 3 requirement: T019

    Returns:
        dict: Health status and current timestamp

    Example response:
        {
            "status": "healthy",
            "timestamp": "2025-12-25T18:30:00.000000"
        }
    """
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


@app.get("/ready")
async def readiness_check() -> JSONResponse:
    """
    Readiness probe endpoint (no authentication required).

    Checks if server is ready to accept traffic by verifying:
    1. Database connectivity (required)
    2. OpenAI API connectivity (optional, logged as warning if fails)

    Kubernetes readiness probe uses this endpoint.
    If this fails, traffic is not routed to this pod.

    Constitution: Section XIV - Cloud-Native Architecture
    Phase 3 requirement: T020

    Returns:
        JSONResponse: 200 if ready, 503 if not ready

    Example responses:
        Success (200):
        {
            "status": "ready",
            "checks": {
                "database": "ok",
                "openai": "ok"
            }
        }

        Failure (503):
        {
            "status": "not_ready",
            "checks": {
                "database": "failed",
                "openai": "not_checked"
            }
        }
    """
    from .db import engine
    from sqlmodel import text

    checks = {"database": "unknown", "openai": "not_checked"}

    # Check 1: Database connectivity (REQUIRED)
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception as e:
        logger.error(f"Database readiness check failed: {e}")
        checks["database"] = "failed"
        return JSONResponse(
            status_code=503,
            content={
                "status": "not_ready",
                "checks": checks,
                "error": "Database connection failed",
            },
        )

    # Check 2: OpenAI API connectivity (OPTIONAL - Phase 3)
    # For Phase 2, skip this check
    # In Phase 3, add: openai.api_key test call
    checks["openai"] = "skipped"  # Phase 2: Not applicable yet

    return JSONResponse(
        status_code=200,
        content={"status": "ready", "checks": checks, "timestamp": datetime.utcnow().isoformat()},
    )


@app.get("/test/long-running")
async def long_running_request():
    """
    Test endpoint for graceful shutdown verification (T124).

    Simulates a long-running request (10 seconds) to verify:
    - Active requests complete before shutdown
    - Graceful shutdown waits for this request

    TEMPORARY: Remove after T124 testing
    """
    import asyncio

    logger.info("Long-running request started (10 seconds)")
    start_time = datetime.utcnow()

    # Simulate long processing (10 seconds)
    for i in range(10):
        await asyncio.sleep(1)
        logger.info(f"Long-running request progress: {i+1}/10 seconds")

    end_time = datetime.utcnow()
    duration = (end_time - start_time).total_seconds()

    logger.info(f"Long-running request completed ({duration:.2f}s)")

    return {
        "status": "completed",
        "message": "Long-running request finished successfully",
        "duration_seconds": duration,
        "start_time": start_time.isoformat(),
        "end_time": end_time.isoformat()
    }


# Mount routers
app.include_router(tasks.router, tags=["tasks"])
app.include_router(auth.router, tags=["auth"])
app.include_router(tags.router, tags=["tags"])
app.include_router(chat.router, tags=["chat"])
