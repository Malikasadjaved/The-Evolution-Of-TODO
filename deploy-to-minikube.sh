#!/bin/bash

# =============================================================================
# Complete Deployment Script for Todo App on Minikube
# =============================================================================
# This script handles the complete deployment workflow:
# 1. Start Minikube
# 2. Build Docker images
# 3. Create Kubernetes secrets
# 4. Deploy application
# 5. Setup port-forwarding
# =============================================================================

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="todo-app"
BACKEND_IMAGE="todo-app-backend:latest"
FRONTEND_IMAGE="todo-app-frontend:latest"

# =============================================================================
# Helper Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}ℹ${NC}  $1"
}

log_success() {
    echo -e "${GREEN}✓${NC}  $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC}  $1"
}

log_error() {
    echo -e "${RED}✗${NC}  $1"
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 is not installed. Please install it first."
        exit 1
    fi
}

# =============================================================================
# Step 0: Prerequisites Check
# =============================================================================

echo ""
echo "=========================================="
echo "  Todo App - Minikube Deployment"
echo "=========================================="
echo ""

log_info "Checking prerequisites..."

check_command "minikube"
check_command "kubectl"
check_command "docker"

log_success "All prerequisites are installed"
echo ""

# =============================================================================
# Step 1: Load Environment Variables
# =============================================================================

log_info "Loading environment variables..."

# Check if .env.secrets exists
if [ ! -f ".env.secrets" ]; then
    log_error ".env.secrets file not found!"
    echo ""
    echo "Please create .env.secrets with the following variables:"
    echo "  DATABASE_URL=<your-neon-postgres-url>"
    echo "  BETTER_AUTH_SECRET=<43-character-secret>"
    echo "  OPENAI_API_KEY=<your-openai-key>"
    echo ""
    echo "You can copy from .env.secrets.example and fill in your values."
    exit 1
fi

# Load secrets
source .env.secrets

# Validate required variables
if [ -z "$DATABASE_URL" ] || [ -z "$BETTER_AUTH_SECRET" ] || [ -z "$OPENAI_API_KEY" ]; then
    log_error "Missing required environment variables in .env.secrets"
    exit 1
fi

log_success "Environment variables loaded"
echo ""

# =============================================================================
# Step 2: Start Minikube
# =============================================================================

log_info "Starting Minikube..."

# Check if Minikube is already running
if minikube status | grep -q "Running"; then
    log_success "Minikube is already running"
else
    minikube start --driver=docker --cpus=4 --memory=4096
    log_success "Minikube started"
fi

# Wait for Kubernetes to be ready
log_info "Waiting for Kubernetes to be ready..."
kubectl wait --for=condition=ready node --all --timeout=300s
log_success "Kubernetes is ready"
echo ""

# =============================================================================
# Step 3: Build Docker Images
# =============================================================================

log_info "Building Docker images in Minikube environment..."

# Configure Docker to use Minikube's Docker daemon
eval $(minikube docker-env)

# Build backend image
log_info "Building backend image..."
docker build -t $BACKEND_IMAGE ./backend
log_success "Backend image built"

# Build frontend image with correct environment variables
log_info "Building frontend image..."
docker build \
  --build-arg NEXT_PUBLIC_BETTER_AUTH_SECRET="$BETTER_AUTH_SECRET" \
  --build-arg NEXT_PUBLIC_API_URL="http://localhost:8000" \
  --build-arg NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000/api/auth" \
  -t $FRONTEND_IMAGE \
  ./frontend-web
log_success "Frontend image built"

# Verify images
log_info "Verifying images..."
docker image ls --filter reference=todo-app* --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
echo ""

# =============================================================================
# Step 4: Create Namespace and Secrets
# =============================================================================

log_info "Creating Kubernetes namespace..."

# Create namespace
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
log_success "Namespace created/verified"

log_info "Creating Kubernetes secrets..."

# Delete old secrets if they exist
kubectl delete secret todo-app-secrets -n $NAMESPACE --ignore-not-found=true

# Create new secrets
kubectl create secret generic todo-app-secrets \
  --from-literal="database-url=$DATABASE_URL" \
  --from-literal="better-auth-secret=$BETTER_AUTH_SECRET" \
  --from-literal="openai-api-key=$OPENAI_API_KEY" \
  --namespace=$NAMESPACE

log_success "Secrets created"
echo ""

# =============================================================================
# Step 5: Deploy Application
# =============================================================================

log_info "Deploying application to Kubernetes..."

# Apply deployment manifests
kubectl apply -f k8s/simple-deployment.yaml

log_success "Deployment manifests applied"

# Wait for pods to be ready
log_info "Waiting for pods to be ready (this may take 2-3 minutes)..."

kubectl wait --for=condition=ready pod -l app=todo-app-backend -n $NAMESPACE --timeout=300s
log_success "Backend pod is ready"

kubectl wait --for=condition=ready pod -l app=todo-app-frontend -n $NAMESPACE --timeout=300s
log_success "Frontend pod is ready"

# Show pod status
kubectl get pods -n $NAMESPACE
echo ""

# =============================================================================
# Step 6: Setup Port-Forwarding
# =============================================================================

log_info "Setting up port-forwarding..."

# Kill any existing port-forwards on 3000 and 8000
pkill -f "kubectl port-forward.*todo-app" 2>/dev/null || true
sleep 2

# Start port-forwarding in background
kubectl port-forward -n $NAMESPACE svc/todo-app-backend 8000:8000 > /dev/null 2>&1 &
BACKEND_PID=$!

kubectl port-forward -n $NAMESPACE svc/todo-app-frontend 3000:3000 > /dev/null 2>&1 &
FRONTEND_PID=$!

# Wait for port-forwards to establish
sleep 5

log_success "Port-forwarding established"
echo ""

# =============================================================================
# Step 7: Health Checks
# =============================================================================

log_info "Running health checks..."

# Check backend
if curl -s http://localhost:8000/health | grep -q "healthy"; then
    log_success "Backend is healthy"
else
    log_warning "Backend health check failed - give it a few more seconds"
fi

# Check frontend
if curl -s -I http://localhost:3000 | grep -q "200"; then
    log_success "Frontend is accessible"
else
    log_warning "Frontend health check failed - give it a few more seconds"
fi

echo ""

# =============================================================================
# Deployment Complete
# =============================================================================

echo "=========================================="
echo -e "${GREEN}  Deployment Complete! 🎉${NC}"
echo "=========================================="
echo ""
echo "📍 Access your application:"
echo "   Frontend:   http://localhost:3000"
echo "   Backend:    http://localhost:8000"
echo "   API Docs:   http://localhost:8000/docs"
echo ""
echo "📊 Kubernetes Resources:"
echo "   Namespace:  $NAMESPACE"
echo "   Pods:       $(kubectl get pods -n $NAMESPACE --no-headers | wc -l)"
echo "   Services:   $(kubectl get svc -n $NAMESPACE --no-headers | wc -l)"
echo ""
echo "🛠️  Useful Commands:"
echo "   View logs:     kubectl logs -f deployment/todo-app-backend -n $NAMESPACE"
echo "   View pods:     kubectl get pods -n $NAMESPACE"
echo "   Restart app:   kubectl rollout restart deployment/todo-app-frontend -n $NAMESPACE"
echo "   Stop app:      minikube stop"
echo "   Delete app:    kubectl delete namespace $NAMESPACE"
echo ""
echo "💡 Port-forwarding is running in background (PIDs: $BACKEND_PID, $FRONTEND_PID)"
echo "   To stop port-forwarding: pkill -f 'kubectl port-forward.*todo-app'"
echo ""
echo "Press Ctrl+C to stop port-forwarding and exit, or close this terminal."
echo ""

# Keep the script running to maintain port-forwards
wait $BACKEND_PID $FRONTEND_PID
