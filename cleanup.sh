#!/bin/bash

# =============================================================================
# Cleanup Script for Todo App Kubernetes Deployment
# =============================================================================
# This script removes all Todo App resources from Minikube
# =============================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

NAMESPACE="todo-app"

echo ""
echo "=========================================="
echo "  Todo App - Cleanup"
echo "=========================================="
echo ""

# Ask for confirmation
read -p "This will delete all Todo App resources. Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo ""
echo -e "${YELLOW}⚠${NC}  Starting cleanup..."

# Kill port-forwarding processes
echo -e "${GREEN}✓${NC}  Stopping port-forwarding..."
pkill -f "kubectl port-forward.*todo-app" 2>/dev/null || true

# Delete namespace (this removes all resources)
echo -e "${GREEN}✓${NC}  Deleting namespace '$NAMESPACE'..."
kubectl delete namespace $NAMESPACE --ignore-not-found=true

# Wait for namespace to be fully deleted
echo -e "${GREEN}✓${NC}  Waiting for namespace deletion..."
kubectl wait --for=delete namespace/$NAMESPACE --timeout=60s 2>/dev/null || true

# Remove Docker images (optional)
read -p "Delete Docker images as well? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}✓${NC}  Removing Docker images..."
    eval $(minikube docker-env)
    docker rmi todo-app-backend:latest 2>/dev/null || true
    docker rmi todo-app-frontend:latest 2>/dev/null || true
fi

echo ""
echo "=========================================="
echo -e "${GREEN}  Cleanup Complete! ✓${NC}"
echo "=========================================="
echo ""
echo "Minikube is still running."
echo "To stop Minikube: minikube stop"
echo "To delete Minikube: minikube delete"
echo ""
