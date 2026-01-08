#!/bin/bash

# ==============================================================================
# Minikube Deployment Automation Script
# ==============================================================================
# Purpose: Automate full deployment to Minikube from scratch
# Phase: IV - Kubernetes Deployment
# ==============================================================================

set -e  # Exit on error

echo "🚀 Todo Application - Minikube Deployment Automation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HELM_CHART="${PROJECT_ROOT}/helm-charts/todo-app"
VALUES_FILE="${HELM_CHART}/values-dev.yaml"
RELEASE_NAME="todo-app"
NAMESPACE="default"

echo "📋 Configuration:"
echo "   Project Root: ${PROJECT_ROOT}"
echo "   Helm Chart: ${HELM_CHART}"
echo "   Values File: ${VALUES_FILE}"
echo "   Release Name: ${RELEASE_NAME}"
echo ""

# Step 1: Start Minikube
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Starting Minikube cluster"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
bash "${PROJECT_ROOT}/scripts/start-minikube.sh"
echo ""

# Step 2: Configure Docker environment
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Configuring Docker environment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⏳ Setting Docker environment to use Minikube daemon..."
eval $(minikube docker-env)
echo -e "${GREEN}✅ Docker environment configured${NC}"
echo ""

# Step 3: Build Docker images
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3: Building Docker images"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "⏳ Building backend image..."
docker build -t todo-backend:latest -f "${PROJECT_ROOT}/docker/backend.Dockerfile" "${PROJECT_ROOT}/backend"
echo -e "${GREEN}✅ Backend image built${NC}"
echo ""

echo "⏳ Building frontend-web image..."
docker build -t todo-frontend-web:latest -f "${PROJECT_ROOT}/docker/frontend-web.Dockerfile" "${PROJECT_ROOT}/frontend-web"
echo -e "${GREEN}✅ Frontend-web image built${NC}"
echo ""

echo "⏳ Building frontend-chatbot image..."
docker build -t todo-frontend-chatbot:latest -f "${PROJECT_ROOT}/docker/frontend-chatbot.Dockerfile" "${PROJECT_ROOT}/frontend-chatbot"
echo -e "${GREEN}✅ Frontend-chatbot image built${NC}"
echo ""

# Step 4: Create Kubernetes secrets
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 4: Creating Kubernetes secrets"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if secret already exists
if kubectl get secret app-secrets -n "${NAMESPACE}" > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Secret 'app-secrets' already exists. Skipping creation.${NC}"
else
    echo -e "${YELLOW}⚠️  Secret 'app-secrets' not found.${NC}"
    echo "You need to create it manually with your actual values:"
    echo ""
    echo "kubectl create secret generic app-secrets \\"
    echo "  --from-literal=DATABASE_URL=\"postgresql://user:pass@host/db?sslmode=require\" \\"
    echo "  --from-literal=BETTER_AUTH_SECRET=\"your-43-character-secret\" \\"
    echo "  --from-literal=OPENAI_API_KEY=\"sk-your-key\""
    echo ""
    read -p "Press Enter after creating the secret, or Ctrl+C to abort..."
fi
echo ""

# Step 5: Install Helm chart
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 5: Installing Helm chart"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Lint chart first
echo "⏳ Linting Helm chart..."
helm lint "${HELM_CHART}"
echo -e "${GREEN}✅ Helm chart linting passed${NC}"
echo ""

# Dry-run
echo "⏳ Running Helm dry-run..."
helm install --dry-run --debug "${RELEASE_NAME}" "${HELM_CHART}" -f "${VALUES_FILE}" > /dev/null
echo -e "${GREEN}✅ Helm dry-run passed${NC}"
echo ""

# Install for real
echo "⏳ Installing Helm release..."
helm install "${RELEASE_NAME}" "${HELM_CHART}" -f "${VALUES_FILE}"
echo -e "${GREEN}✅ Helm release installed${NC}"
echo ""

# Step 6: Wait for pods to be ready
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 6: Waiting for pods to be ready"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⏳ Waiting for all pods (timeout: 5 minutes)..."
kubectl wait --for=condition=Ready pods -l app.kubernetes.io/instance="${RELEASE_NAME}" --timeout=5m -n "${NAMESPACE}"
echo -e "${GREEN}✅ All pods are ready${NC}"
echo ""

# Step 7: Run health checks
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 7: Running health checks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
bash "${PROJECT_ROOT}/scripts/health-check.sh"
echo ""

# Success summary
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📊 Service URLs:"
echo "   Frontend Web: $(minikube service ${RELEASE_NAME}-frontend-web --url -n ${NAMESPACE})"
echo "   Chatbot UI: $(minikube service ${RELEASE_NAME}-frontend-chatbot --url -n ${NAMESPACE})"
echo ""
echo "📝 Next steps:"
echo "   - Open Frontend Web in browser"
echo "   - Sign up / Login"
echo "   - Create tasks via Web UI or Chatbot"
echo ""
echo "📚 Documentation:"
echo "   - View logs: kubectl logs -f deployment/${RELEASE_NAME}-backend"
echo "   - Scale: helm upgrade ${RELEASE_NAME} ${HELM_CHART} --set backend.replicaCount=3"
echo "   - Rollback: helm rollback ${RELEASE_NAME}"
echo ""
