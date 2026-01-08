# Rebuild Frontend for Minikube
# This script rebuilds the frontend Docker image with correct API URLs for Minikube access

Write-Host "🔧 Rebuilding Frontend for Minikube" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

# Get Minikube IP
$MINIKUBE_IP = (minikube ip).Trim()
Write-Host "📍 Minikube IP: $MINIKUBE_IP" -ForegroundColor Green

# Set Docker environment to use Minikube daemon
Write-Host "`n⚙️  Configuring Docker to use Minikube daemon..." -ForegroundColor Yellow
& minikube docker-env --shell powershell | Invoke-Expression

# Build frontend image with correct URLs
Write-Host "`n🏗️  Building frontend image with correct API URLs..." -ForegroundColor Yellow
Write-Host "   NEXT_PUBLIC_API_URL=http://${MINIKUBE_IP}:30002" -ForegroundColor Gray
Write-Host "   NEXT_PUBLIC_BETTER_AUTH_URL=http://${MINIKUBE_IP}:30000/api/auth" -ForegroundColor Gray

docker build `
  -f docker/frontend-web.Dockerfile `
  --build-arg NEXT_PUBLIC_API_URL=http://${MINIKUBE_IP}:30002 `
  --build-arg NEXT_PUBLIC_BETTER_AUTH_SECRET=DicJ0mbjX2VmhOMYzT2vAEn5f5JPEwPVZgEIB6Cy07A `
  --build-arg NEXT_PUBLIC_BETTER_AUTH_URL=http://${MINIKUBE_IP}:30000/api/auth `
  -t todo-frontend-web:latest `
  frontend-web/

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Frontend image rebuilt successfully!" -ForegroundColor Green
    Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Restart frontend deployment:" -ForegroundColor White
    Write-Host "      kubectl rollout restart deployment/todo-app-frontend-web" -ForegroundColor Gray
    Write-Host "   2. Wait for rollout:" -ForegroundColor White
    Write-Host "      kubectl rollout status deployment/todo-app-frontend-web" -ForegroundColor Gray
    Write-Host "   3. Access frontend:" -ForegroundColor White
    Write-Host "      minikube service todo-app-frontend-web --url" -ForegroundColor Gray
} else {
    Write-Host "`n❌ Build failed! Check the error messages above." -ForegroundColor Red
    exit 1
}
