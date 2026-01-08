#!/bin/bash
# =============================================================================
# Build Docker Images for Minikube with Secrets
# =============================================================================
# This script builds all application images and injects secrets securely
# Usage: ./scripts/build-minikube-images.sh
# =============================================================================

set -e

echo "🔨 Building images for Minikube..."
echo ""

# =============================================================================
# Load secrets from .env.local (not committed to Git)
# =============================================================================
FRONTEND_ENV="frontend-web/.env.local"

if [ ! -f "$FRONTEND_ENV" ]; then
  echo "❌ Error: $FRONTEND_ENV not found!"
  echo "   Create it from .env.local.example first"
  exit 1
fi

export BETTER_AUTH_SECRET=$(grep NEXT_PUBLIC_BETTER_AUTH_SECRET "$FRONTEND_ENV" | cut -d'"' -f2)

if [ -z "$BETTER_AUTH_SECRET" ]; then
  echo "❌ Error: BETTER_AUTH_SECRET not found in $FRONTEND_ENV"
  exit 1
fi

echo "✅ Loaded BETTER_AUTH_SECRET from $FRONTEND_ENV (${#BETTER_AUTH_SECRET} characters)"
echo ""

# =============================================================================
# Build Backend (FastAPI)
# =============================================================================
echo "📦 Building backend..."
minikube image build -t todo-backend:latest ./backend
echo "   ✅ Backend image built"
echo ""

# =============================================================================
# Build Frontend Web (Next.js) with secrets
# =============================================================================
echo "📦 Building frontend-web..."
minikube image build \
  --build-arg NEXT_PUBLIC_BETTER_AUTH_SECRET="${BETTER_AUTH_SECRET}" \
  --build-arg NEXT_PUBLIC_API_URL="http://todo-app-backend:8000" \
  --build-arg NEXT_PUBLIC_BETTER_AUTH_URL="http://todo-app-frontend:3000/api/auth" \
  -t todo-frontend-web:latest \
  ./frontend-web
echo "   ✅ Frontend-web image built"
echo ""

# =============================================================================
# Build Frontend Chatbot (React)
# =============================================================================
echo "📦 Building frontend-chatbot..."
minikube image build -t todo-frontend-chatbot:latest ./frontend-chatbot
echo "   ✅ Frontend-chatbot image built"
echo ""

# =============================================================================
# Summary
# =============================================================================
echo "✅ All images built successfully!"
echo ""
echo "📋 Built images:"
minikube image ls | grep "todo-" || echo "   - todo-backend:latest"
echo ""
echo "🚀 Next steps:"
echo "   1. Apply Kubernetes manifests:"
echo "      kubectl apply -f k8s/"
echo ""
echo "   2. Restart deployments to use new images:"
echo "      kubectl rollout restart deployment -n todo-app"
echo ""
echo "   3. Verify pods are running:"
echo "      kubectl get pods -n todo-app"
