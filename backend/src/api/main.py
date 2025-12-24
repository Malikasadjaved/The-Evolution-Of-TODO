"""
FastAPI application initialization.

This is the main entry point for the backend API.
"""

import logging
import time
from datetime import datetime
from typing import Callable

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .db import create_tables
from .routes import auth, tags, tasks

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),  # Console output
    ],
)
logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title="Todo App API - Phase 2",
    description="Full-stack todo application with JWT authentication and user isolation",
    version="2.0.0",
    docs_url="/docs",  # Swagger UI at /docs
    redoc_url="/redoc",  # ReDoc at /redoc
)

# Initialize database tables on startup
create_tables()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],  # Allow frontend origin
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
    logger.info(f"→ {request.method} {request.url.path} from {client_ip}")

    try:
        # Process request
        response = await call_next(request)

        # Calculate processing time
        process_time = time.time() - start_time

        # Log successful response
        logger.info(
            f"← {request.method} {request.url.path} - {response.status_code} "
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
            f"✗ {request.method} {request.url.path} - ERROR: {str(e)} "
            f"({process_time:.3f}s)",
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
app.include_router(tasks.router, tags=["tasks"])
app.include_router(auth.router, tags=["auth"])
app.include_router(tags.router, tags=["tags"])
