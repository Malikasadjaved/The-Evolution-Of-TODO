#!/bin/bash

# ==============================================================================
# Minikube Startup Script
# ==============================================================================
# Purpose: Start Minikube cluster with required resources for Todo application
# Phase: IV - Kubernetes Deployment
# ==============================================================================

set -e  # Exit on error

echo "🚀 Starting Minikube cluster for Todo Application..."
echo ""

# Configuration
CPUS=2
MEMORY=4096  # MB
DISK_SIZE=20g
DRIVER=docker

echo "📋 Configuration:"
echo "   CPUs: ${CPUS}"
echo "   Memory: ${MEMORY}MB"
echo "   Disk: ${DISK_SIZE}"
echo "   Driver: ${DRIVER}"
echo ""

# Start Minikube
echo "🔧 Starting Minikube..."
minikube start \
  --cpus="${CPUS}" \
  --memory="${MEMORY}" \
  --disk-size="${DISK_SIZE}" \
  --driver="${DRIVER}"

echo ""
echo "✅ Minikube started successfully!"
echo ""

# Verify cluster is running
echo "🔍 Verifying cluster status..."
minikube status

echo ""
echo "✅ Cluster verification complete!"
echo ""

# Enable required addons
echo "🔧 Enabling metrics-server addon..."
minikube addons enable metrics-server

echo ""
echo "🔧 Enabling dashboard addon..."
minikube addons enable dashboard

echo ""
echo "✅ Addons enabled successfully!"
echo ""

# Display cluster info
echo "📊 Cluster Information:"
kubectl cluster-info
echo ""

# Display node status
echo "📊 Node Status:"
kubectl get nodes
echo ""

# Display available resources
echo "📊 Available Resources:"
kubectl describe nodes | grep -E "Name:|cpu:|memory:"
echo ""

echo "✅ Minikube cluster setup complete!"
echo ""
echo "Next steps:"
echo "  1. Set Docker environment: eval \$(minikube docker-env)"
echo "  2. Build Docker images in Minikube context"
echo "  3. Deploy application: helm install todo-app ./helm-charts/todo-app"
echo ""
