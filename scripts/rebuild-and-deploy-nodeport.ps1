# Complete Fix for Minikube NodePort Access
# This script rebuilds frontend with stable NodePort URLs

Write-Host "🔧 Kubernetes NodePort Fix - Complete Rebuild" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# Get Minikube IP
$MINIKUBE_IP = & minikube ip
$MINIKUBE_IP = $MINIKUBE_IP.Trim()

if ([string]::IsNullOrWhiteSpace($MINIKUBE_IP)) {
    Write-Host "❌ Failed to get Minikube IP!" -ForegroundColor Red
    Write-Host "   Make sure Minikube is running: minikube status" -ForegroundColor Yellow
    exit 1
}

Write-Host "📍 Minikube IP: $MINIKUBE_IP" -ForegroundColor Green
Write-Host ""

# NodePort URLs (stable, don't change)
$BACKEND_URL = "http://$MINIKUBE_IP`:30002"
$FRONTEND_URL = "http://$MINIKUBE_IP`:30000"

Write-Host "🌐 Service URLs (NodePort - stable):" -ForegroundColor Cyan
Write-Host "   Frontend: $FRONTEND_URL" -ForegroundColor White
Write-Host "   Backend:  $BACKEND_URL" -ForegroundColor White
Write-Host ""

# Step 1: Update Helm to allow NodePort origins
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "Step 1: Updating backend CORS (allow NodePort origins)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

helm upgrade todo-app helm-charts\todo-app -f helm-charts\todo-app\values-dev.yaml
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Helm upgrade failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Backend CORS updated to allow all origins (*)" -ForegroundColor Green
Write-Host ""

# Step 2: Restart backend
Write-Host "🔄 Restarting backend..." -ForegroundColor Yellow
kubectl rollout restart deployment/todo-app-backend
kubectl rollout status deployment/todo-app-backend --timeout=2m
Write-Host "✅ Backend restarted" -ForegroundColor Green
Write-Host ""

# Step 3: Configure Docker to use Minikube daemon
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "Step 2: Rebuilding frontend with NodePort URLs" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

Write-Host "⚙️  Configuring Docker to use Minikube daemon..." -ForegroundColor White
& minikube docker-env --shell powershell | Invoke-Expression

# Step 4: Rebuild frontend
Write-Host "🏗️  Building frontend image..." -ForegroundColor White
Write-Host "   API URL: $BACKEND_URL" -ForegroundColor Gray
Write-Host "   Auth URL: ${FRONTEND_URL}/api/auth" -ForegroundColor Gray
Write-Host ""

docker build `
  -f docker/frontend-web.Dockerfile `
  --build-arg NEXT_PUBLIC_API_URL=$BACKEND_URL `
  --build-arg NEXT_PUBLIC_BETTER_AUTH_SECRET=DicJ0mbjX2VmhOMYzT2vAEn5f5JPEwPVZgEIB6Cy07A `
  --build-arg NEXT_PUBLIC_BETTER_AUTH_URL="${FRONTEND_URL}/api/auth" `
  -t todo-frontend-web:latest `
  frontend-web/

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend image built" -ForegroundColor Green
Write-Host ""

# Step 5: Restart frontend deployment
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "Step 3: Restarting frontend deployment" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

kubectl rollout restart deployment/todo-app-frontend-web
kubectl rollout status deployment/todo-app-frontend-web --timeout=3m

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Rollout failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend deployment restarted" -ForegroundColor Green
Write-Host ""

# Step 6: Verify
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

Write-Host "🌐 Access your application:" -ForegroundColor Cyan
Write-Host "   Frontend:  $FRONTEND_URL" -ForegroundColor White
Write-Host "   Backend:   $BACKEND_URL" -ForegroundColor White
Write-Host "   Chatbot:   http://$MINIKUBE_IP`:30001" -ForegroundColor White
Write-Host ""

Write-Host "📋 Test checklist:" -ForegroundColor Cyan
Write-Host "   [ ] Open $FRONTEND_URL in your browser" -ForegroundColor White
Write-Host "   [ ] Sign up / Login" -ForegroundColor White
Write-Host "   [ ] Create a task" -ForegroundColor White
Write-Host "   [ ] Check browser console (no CORS errors)" -ForegroundColor White
Write-Host ""

Write-Host "🔍 Debug commands:" -ForegroundColor Cyan
Write-Host "   kubectl logs deployment/todo-app-frontend-web --tail=50" -ForegroundColor Gray
Write-Host "   kubectl logs deployment/todo-app-backend --tail=50" -ForegroundColor Gray
Write-Host ""
