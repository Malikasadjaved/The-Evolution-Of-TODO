"""
FastAPI main application for Todo App.

This is the entry point for the backend API.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

from .db import create_db_and_tables
from .routes import tasks

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="Todo API",
    description="RESTful API for Todo application with multi-user support",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Startup event
@app.on_event("startup")
def on_startup():
    """Initialize database tables on startup."""
    create_db_and_tables()


# Health check endpoint
@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "todo-api",
        "version": "2.0.0"
    }


# Include routers
app.include_router(tasks.router)


# Root endpoint
@app.get("/")
def root():
    """Root endpoint with API information."""
    return {
        "message": "Todo API",
        "version": "2.0.0",
        "docs": "/docs",
        "health": "/health"
    }
