# =============================================================================
# Complete Deployment Script for Todo App on Minikube (PowerShell)
# =============================================================================
# This script handles the complete deployment workflow for Windows
# =============================================================================

$ErrorActionPreference = "Stop"

# Configuration
$NAMESPACE = "todo-app"
$BACKEND_IMAGE = "todo-app-backend:latest"
$FRONTEND_IMAGE = "todo-app-frontend:latest"

# =============================================================================
# Helper Functions
# =============================================================================

function Write-Info {
    param($Message)
    Write-Host "ℹ  $Message" -ForegroundColor Blue
}

function Write-Success {
    param($Message)
    Write-Host "✓  $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "⚠  $Message" -ForegroundColor Yellow
}

function Write-Error-Custom {
    param($Message)
    Write-Host "✗  $Message" -ForegroundColor Red
}

function Test-Command {
    param($CommandName)
    if (!(Get-Command $CommandName -ErrorAction SilentlyContinue)) {
        Write-Error-Custom "$CommandName is not installed. Please install it first."
        exit 1
    }
}

# =============================================================================
# Step 0: Prerequisites Check
# =============================================================================

Write-Host ""
Write-Host "=========================================="
Write-Host "  Todo App - Minikube Deployment"
Write-Host "=========================================="
Write-Host ""

Write-Info "Checking prerequisites..."

Test-Command "minikube"
Test-Command "kubectl"
Test-Command "docker"

Write-Success "All prerequisites are installed"
Write-Host ""

# =============================================================================
# Step 1: Load Environment Variables
# =============================================================================

Write-Info "Loading environment variables..."

# Check if .env.secrets exists
if (!(Test-Path ".env.secrets")) {
    Write-Error-Custom ".env.secrets file not found!"
    Write-Host ""
    Write-Host "Please create .env.secrets with the following variables:"
    Write-Host "  DATABASE_URL=<your-neon-postgres-url>"
    Write-Host "  BETTER_AUTH_SECRET=<43-character-secret>"
    Write-Host "  OPENAI_API_KEY=<your-openai-key>"
    Write-Host ""
    Write-Host "You can copy from .env.secrets.example and fill in your values."
    exit 1
}

# Load secrets
Get-Content ".env.secrets" | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.+)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim().Trim('"')
        Set-Variable -Name $name -Value $value -Scope Script
    }
}

# Validate required variables
if (!$DATABASE_URL -or !$BETTER_AUTH_SECRET -or !$OPENAI_API_KEY) {
    Write-Error-Custom "Missing required environment variables in .env.secrets"
    exit 1
}

Write-Success "Environment variables loaded"
Write-Host ""

# =============================================================================
# Step 2: Start Minikube
# =============================================================================

Write-Info "Starting Minikube..."

$minikubeStatus = minikube status 2>$null
if ($minikubeStatus -match "Running") {
    Write-Success "Minikube is already running"
} else {
    minikube start --driver=docker --cpus=4 --memory=4096
    Write-Success "Minikube started"
}

# Wait for Kubernetes to be ready
Write-Info "Waiting for Kubernetes to be ready..."
kubectl wait --for=condition=ready node --all --timeout=300s
Write-Success "Kubernetes is ready"
Write-Host ""

# =============================================================================
# Step 3: Build Docker Images
# =============================================================================

Write-Info "Building Docker images in Minikube environment..."

# Configure Docker to use Minikube's Docker daemon
& minikube -p minikube docker-env --shell powershell | Invoke-Expression

# Build backend image
Write-Info "Building backend image..."
docker build -t $BACKEND_IMAGE ./backend
Write-Success "Backend image built"

# Build frontend image
Write-Info "Building frontend image..."
docker build `
  --build-arg NEXT_PUBLIC_BETTER_AUTH_SECRET="$BETTER_AUTH_SECRET" `
  --build-arg NEXT_PUBLIC_API_URL="http://localhost:8000" `
  --build-arg NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000/api/auth" `
  -t $FRONTEND_IMAGE `
  ./frontend-web
Write-Success "Frontend image built"

# Verify images
Write-Info "Verifying images..."
docker image ls --filter reference=todo-app*
Write-Host ""

# =============================================================================
# Step 4: Create Namespace and Secrets
# =============================================================================

Write-Info "Creating Kubernetes namespace..."

kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
Write-Success "Namespace created/verified"

Write-Info "Creating Kubernetes secrets..."

# Delete old secrets if they exist
kubectl delete secret todo-app-secrets -n $NAMESPACE --ignore-not-found=true

# Create new secrets
kubectl create secret generic todo-app-secrets `
  --from-literal="database-url=$DATABASE_URL" `
  --from-literal="better-auth-secret=$BETTER_AUTH_SECRET" `
  --from-literal="openai-api-key=$OPENAI_API_KEY" `
  --namespace=$NAMESPACE

Write-Success "Secrets created"
Write-Host ""

# =============================================================================
# Step 5: Deploy Application
# =============================================================================

Write-Info "Deploying application to Kubernetes..."

kubectl apply -f k8s/simple-deployment.yaml

Write-Success "Deployment manifests applied"

# Wait for pods to be ready
Write-Info "Waiting for pods to be ready (this may take 2-3 minutes)..."

kubectl wait --for=condition=ready pod -l app=todo-app-backend -n $NAMESPACE --timeout=300s
Write-Success "Backend pod is ready"

kubectl wait --for=condition=ready pod -l app=todo-app-frontend -n $NAMESPACE --timeout=300s
Write-Success "Frontend pod is ready"

# Show pod status
kubectl get pods -n $NAMESPACE
Write-Host ""

# =============================================================================
# Step 6: Setup Port-Forwarding
# =============================================================================

Write-Info "Setting up port-forwarding..."

# Kill any existing port-forwards
Get-Process | Where-Object {$_.ProcessName -eq "kubectl" -and $_.CommandLine -like "*port-forward*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Start port-forwarding in background jobs
$backendJob = Start-Job -ScriptBlock {
    kubectl port-forward -n todo-app svc/todo-app-backend 8000:8000
}

$frontendJob = Start-Job -ScriptBlock {
    kubectl port-forward -n todo-app svc/todo-app-frontend 3000:3000
}

# Wait for port-forwards to establish
Start-Sleep -Seconds 5

Write-Success "Port-forwarding established (Job IDs: $($backendJob.Id), $($frontendJob.Id))"
Write-Host ""

# =============================================================================
# Step 7: Health Checks
# =============================================================================

Write-Info "Running health checks..."

try {
    $healthResponse = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 5
    if ($healthResponse.Content -match "healthy") {
        Write-Success "Backend is healthy"
    }
} catch {
    Write-Warning "Backend health check failed - give it a few more seconds"
}

try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Success "Frontend is accessible"
    }
} catch {
    Write-Warning "Frontend health check failed - give it a few more seconds"
}

Write-Host ""

# =============================================================================
# Deployment Complete
# =============================================================================

Write-Host "=========================================="
Write-Host "  Deployment Complete! 🎉" -ForegroundColor Green
Write-Host "=========================================="
Write-Host ""
Write-Host "📍 Access your application:"
Write-Host "   Frontend:   http://localhost:3000"
Write-Host "   Backend:    http://localhost:8000"
Write-Host "   API Docs:   http://localhost:8000/docs"
Write-Host ""
Write-Host "📊 Kubernetes Resources:"
Write-Host "   Namespace:  $NAMESPACE"
Write-Host "   Pods:       $((kubectl get pods -n $NAMESPACE --no-headers | Measure-Object).Count)"
Write-Host "   Services:   $((kubectl get svc -n $NAMESPACE --no-headers | Measure-Object).Count)"
Write-Host ""
Write-Host "🛠️  Useful Commands:"
Write-Host "   View logs:     kubectl logs -f deployment/todo-app-backend -n $NAMESPACE"
Write-Host "   View pods:     kubectl get pods -n $NAMESPACE"
Write-Host "   Restart app:   kubectl rollout restart deployment/todo-app-frontend -n $NAMESPACE"
Write-Host "   Stop app:      minikube stop"
Write-Host "   Delete app:    kubectl delete namespace $NAMESPACE"
Write-Host ""
Write-Host "💡 Port-forwarding jobs: $($backendJob.Id), $($frontendJob.Id)"
Write-Host "   To stop: Stop-Job -Id $($backendJob.Id),$($frontendJob.Id); Remove-Job -Id $($backendJob.Id),$($frontendJob.Id)"
Write-Host ""
Write-Host "Press Ctrl+C to exit (port-forwarding will continue in background jobs)"
Write-Host "To stop port-forwarding later, run the cleanup script or stop the jobs manually"
Write-Host ""

# Keep monitoring the jobs
Write-Host "Monitoring port-forwarding... Press Ctrl+C to exit"
while ($true) {
    if ($backendJob.State -ne "Running" -or $frontendJob.State -ne "Running") {
        Write-Warning "Port-forwarding job stopped. Restarting..."

        if ($backendJob.State -ne "Running") {
            Remove-Job -Id $backendJob.Id -Force
            $backendJob = Start-Job -ScriptBlock {
                kubectl port-forward -n todo-app svc/todo-app-backend 8000:8000
            }
        }

        if ($frontendJob.State -ne "Running") {
            Remove-Job -Id $frontendJob.Id -Force
            $frontendJob = Start-Job -ScriptBlock {
                kubectl port-forward -n todo-app svc/todo-app-frontend 3000:3000
            }
        }
    }
    Start-Sleep -Seconds 10
}
