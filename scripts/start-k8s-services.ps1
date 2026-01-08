# Todo App Kubernetes Port-Forward Script
# This script makes all services accessible on localhost

Write-Host "🚀 Starting Todo App Services via Port-Forward..." -ForegroundColor Green
Write-Host ""

# Check if kubectl is available
if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
    Write-Host "❌ kubectl not found. Please install kubectl first." -ForegroundColor Red
    exit 1
}

# Check if pods are running
Write-Host "📋 Checking pod status..." -ForegroundColor Cyan
kubectl get pods -n todo-app

$backendPods = kubectl get pods -n todo-app -l app.kubernetes.io/name=backend -o jsonpath='{.items[*].status.phase}'
$frontendWebPods = kubectl get pods -n todo-app -l app.kubernetes.io/name=frontend-web -o jsonpath='{.items[*].status.phase}'

if ($backendPods -notcontains "Running" -or $frontendWebPods -notcontains "Running") {
    Write-Host "⚠️  Some pods are not running. Please wait for pods to be ready." -ForegroundColor Yellow
    Write-Host "   Run: kubectl get pods -n todo-app" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "✅ All pods are running!" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Setting up port-forwards..." -ForegroundColor Cyan
Write-Host ""

# Kill existing port-forward processes (if any)
Get-Process | Where-Object {$_.CommandLine -like "*port-forward*todo-app*"} | Stop-Process -Force 2>$null

# Start port-forwards in background
Write-Host "   Backend:        localhost:8000 -> todo-app-backend:8000" -ForegroundColor White
Start-Process powershell -ArgumentList "-NoExit", "-Command", "kubectl port-forward -n todo-app svc/todo-app-backend 8000:8000" -WindowStyle Minimized

Start-Sleep -Seconds 2

Write-Host "   Frontend Web:   localhost:3000 -> todo-app-frontend-web:3000" -ForegroundColor White
Start-Process powershell -ArgumentList "-NoExit", "-Command", "kubectl port-forward -n todo-app svc/todo-app-frontend-web 3000:3000" -WindowStyle Minimized

Start-Sleep -Seconds 2

Write-Host "   Chatbot:        localhost:3001 -> todo-app-frontend-chatbot:3001" -ForegroundColor White
Start-Process powershell -ArgumentList "-NoExit", "-Command", "kubectl port-forward -n todo-app svc/todo-app-frontend-chatbot 3001:3001" -WindowStyle Minimized

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "✅ Port-forwards are active!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Access your application at:" -ForegroundColor Cyan
Write-Host "   Frontend:       http://localhost:3000" -ForegroundColor Yellow
Write-Host "   Backend API:    http://localhost:8000" -ForegroundColor Yellow
Write-Host "   Backend Docs:   http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host "   Chatbot:        http://localhost:3001" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  Note: Port-forward windows are minimized in taskbar" -ForegroundColor Magenta
Write-Host "   Do NOT close those PowerShell windows or connections will drop" -ForegroundColor Magenta
Write-Host ""
Write-Host "🛑 To stop all port-forwards:" -ForegroundColor Red
Write-Host "   Close the minimized PowerShell windows in taskbar" -ForegroundColor Red
Write-Host "   Or run: Get-Process | Where-Object {`$_.CommandLine -like '*port-forward*todo-app*'} | Stop-Process" -ForegroundColor Red
Write-Host ""
Write-Host "Press any key to open Frontend in browser..." -ForegroundColor Green
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Start-Process "http://localhost:3000"
