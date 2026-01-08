#!/bin/bash

# Complete startup script for Todo App

set -e

echo "🚀 Starting Todo App on Minikube..."
echo ""

# Function to check if port is in use
check_port() {
    nc -z localhost $1 > /dev/null 2>&1
}

# 1. Start Minikube
echo "📦 Starting Minikube..."
minikube start

# 2. Wait for Kubernetes to be ready
echo "⏳ Waiting for Kubernetes to be ready..."
kubectl wait --for=condition=ready node --all --timeout=300s

# 3. Wait for pods
echo "⏳ Waiting for application pods..."
kubectl wait --for=condition=ready pod -l app=todo-app-backend -n todo-app --timeout=120s || {
    echo "⚠️  Backend pod not ready, checking status..."
    kubectl get pods -n todo-app
}

kubectl wait --for=condition=ready pod -l app=todo-app-frontend -n todo-app --timeout=120s || {
    echo "⚠️  Frontend pod not ready, checking status..."
    kubectl get pods -n todo-app
}

# 4. Check if ports are already in use
if check_port 8000; then
    echo "⚠️  Port 8000 already in use, killing existing process..."
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
fi

if check_port 3000; then
    echo "⚠️  Port 3000 already in use, killing existing process..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
fi

# 5. Setup port-forward
echo "🌐 Setting up port-forward..."
kubectl port-forward -n todo-app svc/todo-app-backend 8000:8000 > /dev/null 2>&1 &
BACKEND_PID=$!

kubectl port-forward -n todo-app svc/todo-app-frontend 3000:3000 > /dev/null 2>&1 &
FRONTEND_PID=$!

# Wait for port-forward to establish
sleep 3

# 6. Verify
echo "✅ Verifying services..."
if curl -s http://localhost:8000/health | grep -q "healthy"; then
    echo "   ✅ Backend is healthy"
else
    echo "   ❌ Backend health check failed"
fi

if curl -s -I http://localhost:3000 | grep -q "200 OK"; then
    echo "   ✅ Frontend is accessible"
else
    echo "   ❌ Frontend health check failed"
fi

echo ""
echo "✨ Todo App is ready!"
echo ""
echo "📍 Access URLs:"
echo "   Frontend:   http://localhost:3000"
echo "   Backend:    http://localhost:8000"
echo "   API Docs:   http://localhost:8000/docs"
echo ""
echo "💡 To stop, press Ctrl+C or run: minikube stop"
echo ""

# Keep running
wait $BACKEND_PID $FRONTEND_PID
