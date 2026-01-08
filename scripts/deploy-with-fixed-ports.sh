#!/bin/bash

# Deploy Todo App to Minikube with Fixed Ports
# This script ensures stable access at:
# - Frontend: http://192.168.49.2:3000
# - Backend: http://192.168.49.2:8000

set -e

echo "🚀 Deploying Todo App with Fixed Ports to Minikube..."

# Step 1: Get Minikube IP
MINIKUBE_IP=$(minikube ip)
echo "📍 Minikube IP: $MINIKUBE_IP"

# Step 2: Update values.yaml with actual Minikube IP
echo "📝 Updating Helm values with Minikube IP..."
sed -i "s/192\.168\.49\.2/$MINIKUBE_IP/g" helm-charts/todo-app/values.yaml

# Step 3: Build Docker images in Minikube
echo "🐳 Building Docker images..."
eval $(minikube docker-env)

echo "   Building backend image..."
docker build -t todo-backend:latest -f docker/backend.Dockerfile .

echo "   Building frontend-web image..."
docker build -t todo-frontend-web:latest -f docker/frontend-web.Dockerfile .

echo "   Building frontend-chatbot image..."
docker build -t todo-frontend-chatbot:latest -f docker/frontend-chatbot.Dockerfile .

# Step 4: Create namespace if it doesn't exist
kubectl create namespace todo-app --dry-run=client -o yaml | kubectl apply -f -

# Step 5: Create secrets
echo "🔐 Creating secrets..."
kubectl create secret generic app-secrets \
  --from-literal=DATABASE_URL="${DATABASE_URL}" \
  --from-literal=BETTER_AUTH_SECRET="${BETTER_AUTH_SECRET}" \
  --from-literal=OPENAI_API_KEY="${OPENAI_API_KEY}" \
  --namespace=todo-app \
  --dry-run=client -o yaml | kubectl apply -f -

# Step 6: Deploy with Helm
echo "📦 Deploying with Helm..."
helm upgrade --install todo-app ./helm-charts/todo-app \
  --namespace todo-app \
  --set backend.image.tag=latest \
  --set frontendWeb.image.tag=latest \
  --set frontendChatbot.image.tag=latest \
  --wait \
  --timeout 5m

# Step 7: Wait for deployments to be ready
echo "⏳ Waiting for deployments to be ready..."
kubectl rollout status deployment/todo-app-backend -n todo-app
kubectl rollout status deployment/todo-app-frontend-web -n todo-app
kubectl rollout status deployment/todo-app-frontend-chatbot -n todo-app

# Step 8: Display access URLs
echo ""
echo "✅ Deployment Complete!"
echo ""
echo "📱 Access your application at:"
echo "   Frontend Web: http://$MINIKUBE_IP:30000"
echo "   Backend API:  http://$MINIKUBE_IP:30800"
echo "   Chatbot:      http://$MINIKUBE_IP:30001"
echo ""
echo "🔍 Verify services:"
echo "   kubectl get services -n todo-app"
echo "   kubectl get pods -n todo-app"
echo ""
echo "📊 View logs:"
echo "   kubectl logs -f deployment/todo-app-backend -n todo-app"
echo "   kubectl logs -f deployment/todo-app-frontend-web -n todo-app"
echo ""
