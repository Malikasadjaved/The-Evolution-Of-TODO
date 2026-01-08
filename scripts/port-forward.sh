#!/bin/bash
# Port-Forward Script for Todo App
# Makes K8s services accessible on localhost

echo "🚀 Starting Port-Forward for Todo App..."
echo ""

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl not found. Please install kubectl first."
    exit 1
fi

# Check if pods are running
echo "📦 Checking pod status..."
BACKEND_POD=$(kubectl get pods -n todo-app -l app=todo-app-backend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
FRONTEND_POD=$(kubectl get pods -n todo-app -l app=todo-app-frontend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)

if [ -z "$BACKEND_POD" ]; then
    echo "❌ Backend pod not found. Please deploy first."
    exit 1
fi

if [ -z "$FRONTEND_POD" ]; then
    echo "❌ Frontend pod not found. Please deploy first."
    exit 1
fi

echo "✅ Backend pod: $BACKEND_POD"
echo "✅ Frontend pod: $FRONTEND_POD"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping port-forwards..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start port-forwards
echo "🔄 Starting port-forwards..."
echo ""

kubectl port-forward -n todo-app "pod/$BACKEND_POD" 8000:8000 &
BACKEND_PID=$!
echo "✅ Backend: http://localhost:8000 (PID: $BACKEND_PID)"

kubectl port-forward -n todo-app "pod/$FRONTEND_POD" 3000:3000 &
FRONTEND_PID=$!
echo "✅ Frontend: http://localhost:3000 (PID: $FRONTEND_PID)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Todo App is now accessible!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 URLs:"
echo "   Backend API: http://localhost:8000"
echo "   Swagger Docs: http://localhost:8000/docs"
echo "   Frontend Web: http://localhost:3000"
echo ""
echo "⏸️  Press Ctrl+C to stop port-forwarding"
echo ""

# Wait for port-forwards to exit
wait
