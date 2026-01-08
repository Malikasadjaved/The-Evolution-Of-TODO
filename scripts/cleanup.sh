#!/bin/bash

# ==============================================================================
# Cleanup Script for Minikube Deployment
# ==============================================================================
# Purpose: Remove all deployed resources and optionally stop/delete Minikube
# Phase: IV - Kubernetes Deployment
# ==============================================================================

set -e  # Exit on error

echo "🧹 Todo Application - Cleanup Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
RELEASE_NAME="todo-app"
NAMESPACE="default"

# Function to confirm action
confirm() {
    read -p "$1 (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return 1
    fi
    return 0
}

echo "This script will remove the following:"
echo "  - Helm release: ${RELEASE_NAME}"
echo "  - Kubernetes Secret: app-secrets (optional)"
echo "  - Minikube cluster (optional)"
echo ""

# Step 1: Uninstall Helm release
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Uninstalling Helm release"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if helm list -n "${NAMESPACE}" | grep -q "${RELEASE_NAME}"; then
    echo "⏳ Uninstalling Helm release '${RELEASE_NAME}'..."
    helm uninstall "${RELEASE_NAME}" -n "${NAMESPACE}"
    echo -e "${GREEN}✅ Helm release uninstalled${NC}"
else
    echo -e "${YELLOW}⚠️  Helm release '${RELEASE_NAME}' not found. Skipping.${NC}"
fi
echo ""

# Wait for pods to terminate
echo "⏳ Waiting for pods to terminate..."
sleep 5
echo ""

# Step 2: Delete Kubernetes Secret
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Deleting Kubernetes Secret"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if kubectl get secret app-secrets -n "${NAMESPACE}" > /dev/null 2>&1; then
    if confirm "Delete Kubernetes Secret 'app-secrets'?"; then
        kubectl delete secret app-secrets -n "${NAMESPACE}"
        echo -e "${GREEN}✅ Secret deleted${NC}"
    else
        echo -e "${YELLOW}⚠️  Keeping secret 'app-secrets'${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Secret 'app-secrets' not found. Skipping.${NC}"
fi
echo ""

# Step 3: Verify cleanup
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3: Verifying cleanup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "⏳ Checking for remaining resources..."

REMAINING_PODS=$(kubectl get pods -n "${NAMESPACE}" | grep -c "todo-" || true)
REMAINING_SERVICES=$(kubectl get svc -n "${NAMESPACE}" | grep -c "todo-" || true)

if [ "$REMAINING_PODS" -eq 0 ] && [ "$REMAINING_SERVICES" -eq 0 ]; then
    echo -e "${GREEN}✅ All Todo App resources removed${NC}"
else
    echo -e "${YELLOW}⚠️  Some resources still exist:${NC}"
    [ "$REMAINING_PODS" -gt 0 ] && kubectl get pods -n "${NAMESPACE}" | grep "todo-"
    [ "$REMAINING_SERVICES" -gt 0 ] && kubectl get svc -n "${NAMESPACE}" | grep "todo-"
fi
echo ""

# Step 4: Stop/Delete Minikube (optional)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 4: Minikube cluster management"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if minikube status > /dev/null 2>&1; then
    echo "Minikube cluster is running."
    echo ""
    echo "Options:"
    echo "  1) Stop cluster (preserves state)"
    echo "  2) Delete cluster entirely (removes all data)"
    echo "  3) Keep cluster running"
    echo ""
    read -p "Choose option (1-3): " -n 1 -r
    echo ""

    case $REPLY in
        1)
            echo "⏳ Stopping Minikube cluster..."
            minikube stop
            echo -e "${GREEN}✅ Minikube stopped${NC}"
            ;;
        2)
            echo "⏳ Deleting Minikube cluster..."
            minikube delete
            echo -e "${GREEN}✅ Minikube deleted${NC}"
            ;;
        3)
            echo -e "${GREEN}✅ Keeping Minikube running${NC}"
            ;;
        *)
            echo -e "${YELLOW}Invalid option. Keeping Minikube running.${NC}"
            ;;
    esac
else
    echo -e "${YELLOW}⚠️  Minikube cluster not found or not running.${NC}"
fi
echo ""

# Step 5: Reset Docker environment (if Minikube stopped/deleted)
if ! minikube status > /dev/null 2>&1; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Step 5: Resetting Docker environment"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    eval $(minikube docker-env --unset) || true
    echo -e "${GREEN}✅ Docker environment reset to local${NC}"
    echo ""
fi

# Cleanup summary
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🧹 Cleanup completed!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "To redeploy:"
echo "  bash scripts/deploy-minikube.sh"
echo ""
