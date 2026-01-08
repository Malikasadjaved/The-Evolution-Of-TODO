#!/bin/bash
# =============================================================================
# Production Port-Forward Script for Kubernetes Services
# =============================================================================
# Purpose: Automatically discover pods and setup port-forwarding
# Usage: ./port-forward.sh [namespace] [project-name]
# Stop: Press Ctrl+C (cleanup is automatic)
# =============================================================================

set -e  # Exit on error

# =============================================================================
# Configuration
# =============================================================================

# Accept namespace and project as arguments, or use defaults
NAMESPACE="${1:-app}"
PROJECT="${2:-todo-app}"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Cleanup function (called on Ctrl+C)
cleanup() {
    echo ""
    log_warning "Stopping port-forwards..."

    # Kill all background jobs (port-forward processes)
    kill $(jobs -p) 2>/dev/null || true

    log_success "Cleanup complete"
    exit 0
}

# Register cleanup function to run on script exit
trap cleanup SIGINT SIGTERM

# =============================================================================
# Pre-flight Checks
# =============================================================================

log_info "🚀 Starting Port-Forward for $PROJECT..."
echo ""

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    log_error "kubectl not found. Please install kubectl first."
    exit 1
fi

# Check if namespace exists
if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
    log_error "Namespace '$NAMESPACE' not found"
    log_info "Available namespaces:"
    kubectl get namespaces
    exit 1
fi

# =============================================================================
# Service Discovery
# =============================================================================

log_info "🔍 Discovering pods in namespace '$NAMESPACE'..."

# Discover backend pod
BACKEND_POD=$(kubectl get pods -n "$NAMESPACE" -l app=${PROJECT}-backend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)

# Discover frontend pod
FRONTEND_POD=$(kubectl get pods -n "$NAMESPACE" -l app=${PROJECT}-frontend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)

# Validate pod discovery
if [ -z "$BACKEND_POD" ]; then
    log_error "Backend pod not found in namespace '$NAMESPACE'"
    log_info "Make sure deployment is running: kubectl get pods -n $NAMESPACE"
    exit 1
fi

if [ -z "$FRONTEND_POD" ]; then
    log_error "Frontend pod not found in namespace '$NAMESPACE'"
    log_info "Make sure deployment is running: kubectl get pods -n $NAMESPACE"
    exit 1
fi

log_success "Found backend pod: $BACKEND_POD"
log_success "Found frontend pod: $FRONTEND_POD"
echo ""

# =============================================================================
# Port Discovery
# =============================================================================

log_info "🔍 Discovering service ports..."

# Get backend port from service
BACKEND_PORT=$(kubectl get service -n "$NAMESPACE" ${PROJECT}-backend -o jsonpath='{.spec.ports[0].port}' 2>/dev/null)

# Get frontend port from service
FRONTEND_PORT=$(kubectl get service -n "$NAMESPACE" ${PROJECT}-frontend -o jsonpath='{.spec.ports[0].port}' 2>/dev/null)

if [ -z "$BACKEND_PORT" ]; then
    log_warning "Backend port not found, using default: 8000"
    BACKEND_PORT=8000
fi

if [ -z "$FRONTEND_PORT" ]; then
    log_warning "Frontend port not found, using default: 3000"
    FRONTEND_PORT=3000
fi

log_success "Backend port: $BACKEND_PORT"
log_success "Frontend port: $FRONTEND_PORT"
echo ""

# =============================================================================
# Pod Health Check
# =============================================================================

log_info "🏥 Checking pod health..."

# Check backend pod status
BACKEND_STATUS=$(kubectl get pod -n "$NAMESPACE" "$BACKEND_POD" -o jsonpath='{.status.phase}')
if [ "$BACKEND_STATUS" != "Running" ]; then
    log_error "Backend pod is not running (status: $BACKEND_STATUS)"
    kubectl describe pod -n "$NAMESPACE" "$BACKEND_POD" | tail -20
    exit 1
fi

# Check frontend pod status
FRONTEND_STATUS=$(kubectl get pod -n "$NAMESPACE" "$FRONTEND_POD" -o jsonpath='{.status.phase}')
if [ "$FRONTEND_STATUS" != "Running" ]; then
    log_error "Frontend pod is not running (status: $FRONTEND_STATUS)"
    kubectl describe pod -n "$NAMESPACE" "$FRONTEND_POD" | tail -20
    exit 1
fi

log_success "All pods are healthy"
echo ""

# =============================================================================
# Start Port-Forwarding
# =============================================================================

log_info "🌐 Starting port-forwards..."

# Start backend port-forward in background
kubectl port-forward -n "$NAMESPACE" "pod/$BACKEND_POD" ${BACKEND_PORT}:${BACKEND_PORT} > /dev/null 2>&1 &
BACKEND_PID=$!

# Start frontend port-forward in background
kubectl port-forward -n "$NAMESPACE" "pod/$FRONTEND_POD" ${FRONTEND_PORT}:${FRONTEND_PORT} > /dev/null 2>&1 &
FRONTEND_PID=$!

# Wait a moment for port-forwards to establish
sleep 2

# Verify port-forwards are active
if ! ps -p $BACKEND_PID > /dev/null 2>&1; then
    log_error "Backend port-forward failed to start"
    exit 1
fi

if ! ps -p $FRONTEND_PID > /dev/null 2>&1; then
    log_error "Frontend port-forward failed to start"
    exit 1
fi

echo ""
log_success "✨ $PROJECT is now accessible!"
echo ""

# =============================================================================
# Display Access Information
# =============================================================================

echo "📍 Access URLs:"
echo "   Backend API:    http://localhost:${BACKEND_PORT}"
echo "   API Docs:       http://localhost:${BACKEND_PORT}/docs"
echo "   Frontend Web:   http://localhost:${FRONTEND_PORT}"
echo ""

echo "🔧 Management Commands:"
echo "   View backend logs:   kubectl logs -f -n $NAMESPACE deployment/${PROJECT}-backend"
echo "   View frontend logs:  kubectl logs -f -n $NAMESPACE deployment/${PROJECT}-frontend"
echo "   Check pod status:    kubectl get pods -n $NAMESPACE"
echo ""

echo "💡 Press Ctrl+C to stop port-forwarding"
echo ""

# =============================================================================
# Optional: Health Check Verification
# =============================================================================

log_info "🏥 Verifying health endpoints..."

# Check backend health (if curl available)
if command -v curl &> /dev/null; then
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:${BACKEND_PORT}/health" | grep -q "200"; then
        log_success "Backend health check passed"
    else
        log_warning "Backend health check failed (service may still be starting up)"
    fi

    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:${FRONTEND_PORT}" | grep -q "200"; then
        log_success "Frontend health check passed"
    else
        log_warning "Frontend health check failed (service may still be starting up)"
    fi
else
    log_warning "curl not installed, skipping health checks"
fi

echo ""

# =============================================================================
# Keep Running
# =============================================================================

# Keep script running (wait for background jobs)
wait
