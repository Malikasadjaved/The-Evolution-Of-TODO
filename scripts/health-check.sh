#!/bin/bash

# ==============================================================================
# Health Check Smoke Test Script
# ==============================================================================
# Purpose: Verify all services are healthy after deployment
# Phase: IV - Kubernetes Deployment
# ==============================================================================

set -e  # Exit on error

echo "🏥 Running health checks for Todo Application..."
echo ""

# Colors for output
GREEN='\033[0.32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
TIMEOUT=120  # seconds
NAMESPACE=default

# Function to check if pods are ready
check_pods_ready() {
    local label=$1
    local service_name=$2

    echo "⏳ Waiting for ${service_name} pods to be ready..."

    if kubectl wait --for=condition=Ready pods -l "${label}" --timeout="${TIMEOUT}s" -n "${NAMESPACE}" 2>/dev/null; then
        echo -e "${GREEN}✅ ${service_name} pods are ready${NC}"
        return 0
    else
        echo -e "${RED}❌ ${service_name} pods are NOT ready${NC}"
        kubectl get pods -l "${label}" -n "${NAMESPACE}"
        return 1
    fi
}

# Function to check backend health endpoint
check_backend_health() {
    echo "⏳ Checking backend /health endpoint..."

    # Port-forward in background
    kubectl port-forward svc/todo-app-backend 8000:8000 -n "${NAMESPACE}" > /dev/null 2>&1 &
    PF_PID=$!

    # Wait for port-forward to establish
    sleep 3

    # Check health endpoint
    if curl -f -s http://localhost:8000/health > /dev/null; then
        echo -e "${GREEN}✅ Backend health check: PASS${NC}"
        kill $PF_PID 2>/dev/null
        return 0
    else
        echo -e "${RED}❌ Backend health check: FAIL${NC}"
        kill $PF_PID 2>/dev/null
        return 1
    fi
}

# Function to check frontend accessibility
check_frontend_accessibility() {
    local service_name=$1
    local display_name=$2

    echo "⏳ Checking ${display_name} accessibility..."

    # Get service URL from Minikube
    URL=$(minikube service "${service_name}" --url -n "${NAMESPACE}" 2>/dev/null)

    if [ -z "$URL" ]; then
        echo -e "${RED}❌ Could not get ${display_name} URL${NC}"
        return 1
    fi

    # Check if service responds
    if curl -f -s "${URL}" > /dev/null; then
        echo -e "${GREEN}✅ ${display_name} accessible at: ${URL}${NC}"
        return 0
    else
        echo -e "${RED}❌ ${display_name} not accessible at: ${URL}${NC}"
        return 1
    fi
}

# Main health check sequence
main() {
    echo "📋 Health Check Summary:"
    echo "   Namespace: ${NAMESPACE}"
    echo "   Timeout: ${TIMEOUT}s"
    echo ""

    FAILED=0

    # Check backend pods
    if ! check_pods_ready "app=backend" "Backend"; then
        FAILED=$((FAILED + 1))
    fi
    echo ""

    # Check frontend-web pods
    if ! check_pods_ready "app=frontend-web" "Frontend-Web"; then
        FAILED=$((FAILED + 1))
    fi
    echo ""

    # Check frontend-chatbot pods
    if ! check_pods_ready "app=frontend-chatbot" "Frontend-Chatbot"; then
        FAILED=$((FAILED + 1))
    fi
    echo ""

    # Check backend health endpoint
    if ! check_backend_health; then
        FAILED=$((FAILED + 1))
    fi
    echo ""

    # Check frontend-web accessibility
    if ! check_frontend_accessibility "todo-app-frontend-web" "Frontend-Web"; then
        FAILED=$((FAILED + 1))
    fi
    echo ""

    # Check frontend-chatbot accessibility
    if ! check_frontend_accessibility "todo-app-frontend-chatbot" "Frontend-Chatbot"; then
        FAILED=$((FAILED + 1))
    fi
    echo ""

    # Summary
    if [ $FAILED -eq 0 ]; then
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}✅ All health checks passed!${NC}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        exit 0
    else
        echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${RED}❌ ${FAILED} health check(s) failed${NC}"
        echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        echo "Troubleshooting tips:"
        echo "  1. Check pod logs: kubectl logs -l app=<service-name>"
        echo "  2. Describe pods: kubectl describe pods"
        echo "  3. Check events: kubectl get events --sort-by='.lastTimestamp'"
        echo "  4. Verify secrets: kubectl get secret app-secrets"
        exit 1
    fi
}

# Run main function
main
