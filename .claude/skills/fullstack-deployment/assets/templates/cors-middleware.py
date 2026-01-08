"""
FastAPI CORS Middleware Template for Vercel + Railway Deployment

This template configures CORS to allow your Vercel frontend to communicate
with your Railway backend.

Usage:
1. Copy this code to backend/src/api/main.py
2. Set FRONTEND_URL environment variable on Railway
3. Redeploy Railway service
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings

app = FastAPI(
    title="Your API",
    description="Your API Description",
    version="1.0.0"
)

# Parse comma-separated frontend URLs from environment variable
# Example: "https://web.vercel.app,https://chatbot.vercel.app"
frontend_origins = [
    url.strip()
    for url in settings.frontend_url.split(",")
]

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,      # Which domains can make requests
    allow_credentials=True,               # Allow cookies and Authorization headers
    allow_methods=["*"],                  # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],                  # Allow all headers
)

# Health check endpoint (no auth required)
@app.get("/health")
async def health():
    """
    Health check endpoint for Railway deployment verification.
    """
    return {"status": "healthy"}

# Log CORS configuration on startup (for debugging)
@app.on_event("startup")
async def startup_event():
    import logging
    logger = logging.getLogger("uvicorn")
    logger.info(f"CORS allowed origins: {frontend_origins}")
