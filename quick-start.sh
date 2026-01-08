#!/bin/bash

# =============================================================================
# Quick Start Script for Todo App
# =============================================================================
# Use this script when application is already deployed to Minikube
# This script only:
# 1. Starts Minikube (if not running)
# 2. Sets up port-forwarding
# 3. Verifies services are healthy
# =============================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

NAMESPACE="todo-app"

log_info() {
    echo -e "${BLUE}ℹ${NC}  $1"
}

log_success() {
    echo -e "${GREEN}✓${NC}  $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC}  $1"
}

echo ""
echo "=========================================="
echo "  Todo App - Quick Start"
echo "=========================================="
echo ""

# =============================================================================
# Step 1: Start Minikube
# =============================================================================

log_info "Starting Minikube..."

if minikube status | grep -q "Running"; then
    log_success "Minikube is already running"
else
    minikube start
    log_success "Minikube started"
fi

# Wait for Kubernetes
kubectl wait --for=condition=ready node --all --timeout=60s
log_success "Kubernetes is ready"
echo ""

# =============================================================================
# Step 2: Check if Application is Deployed
# =============================================================================

log_info "Checking if application is deployed..."

if kubectl get namespace $NAMESPACE &> /dev/null; then
    log_success "Namespace '$NAMESPACE' exists"
else
    log_warning "Application not deployed yet!"
    echo ""
    echo "Run the full deployment script first:"
    echo "  ./deploy-to-minikube.sh"
    echo ""
    exit 1
fi

# Check pods
BACKEND_READY=$(kubectl get pods -n $NAMESPACE -l app=todo-app-backend -o jsonpath='{.items[0].status.conditions[?(@.type=="Ready")].status}' 2>/dev/null || echo "False")
FRONTEND_READY=$(kubectl get pods -n $NAMESPACE -l app=todo-app-frontend -o jsonpath='{.items[0].status.conditions[?(@.type=="Ready")].status}' 2>/dev/null || echo "False")

if [ "$BACKEND_READY" = "True" ]; then
    log_success "Backend pod is ready"
else
    log_warning "Backend pod is not ready, waiting..."
    kubectl wait --for=condition=ready pod -l app=todo-app-backend -n $NAMESPACE --timeout=120s
    log_success "Backend pod is now ready"
fi

if [ "$FRONTEND_READY" = "True" ]; then
    log_success "Frontend pod is ready"
else
    log_warning "Frontend pod is not ready, waiting..."
    kubectl wait --for=condition=ready pod -l app=todo-app-frontend -n $NAMESPACE --timeout=120s
    log_success "Frontend pod is now ready"
fi

echo ""

# =============================================================================
# Step 3: Setup Port-Forwarding
# =============================================================================

log_info "Setting up port-forwarding..."

# Kill any existing port-forwards
pkill -f "kubectl port-forward.*todo-app" 2>/dev/null || true
sleep 2

# Start port-forwarding
kubectl port-forward -n $NAMESPACE svc/todo-app-backend 8000:8000 > /dev/null 2>&1 &
BACKEND_PID=$!

kubectl port-forward -n $NAMESPACE svc/todo-app-frontend 3000:3000 > /dev/null 2>&1 &
FRONTEND_PID=$!

# Wait for port-forwards to establish
sleep 5

log_success "Port-forwarding established"
echo ""

# =============================================================================
# Step 4: Health Checks
# =============================================================================

log_info "Running health checks..."

if curl -s http://localhost:8000/health | grep -q "healthy"; then
    log_success "Backend is healthy"
else
    log_warning "Backend health check failed"
fi

if curl -s -I http://localhost:3000 | grep -q "200"; then
    log_success "Frontend is accessible"
else
    log_warning "Frontend health check failed"
fi

echo ""

# =============================================================================
# Ready
# =============================================================================

echo "=========================================="
echo -e "${GREEN}  Todo App is Ready! 🚀${NC}"
echo "=========================================="
echo ""
echo "📍 Access your application:"
echo "   Frontend:   http://localhost:3000"
echo "   Backend:    http://localhost:8000"
echo "   API Docs:   http://localhost:8000/docs"
echo ""
echo "💡 Port-forwarding is running (PIDs: $BACKEND_PID, $FRONTEND_PID)"
echo "   Press Ctrl+C to stop, or close this terminal"
echo ""

# Keep script running
wait $BACKEND_PID $FRONTEND_PID
