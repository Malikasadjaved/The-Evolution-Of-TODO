# Kubernetes Deployment Guide - Todo App

Complete guide for deploying the Todo Application to Minikube (local Kubernetes cluster).

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [First Time Setup](#first-time-setup)
- [Daily Usage](#daily-usage)
- [Architecture](#architecture)
- [Troubleshooting](#troubleshooting)
- [Advanced Usage](#advanced-usage)

---

## 🚀 Quick Start

### First Time Deployment

```bash
# 1. Copy environment template
cp .env.secrets.example .env.secrets

# 2. Edit .env.secrets and fill in your actual values
# Use your favorite editor: vim, nano, code, notepad++

# 3. Run deployment script
chmod +x deploy-to-minikube.sh
./deploy-to-minikube.sh
```

### Subsequent Starts (App Already Deployed)

```bash
# Quick start script (only starts Minikube and port-forwarding)
chmod +x quick-start.sh
./quick-start.sh
```

### Windows Users

```powershell
# First time deployment
.\deploy-to-minikube.ps1

# Subsequent starts
.\quick-start.ps1
```

---

## 📦 Prerequisites

### Required Software

| Tool | Version | Purpose | Install Link |
|------|---------|---------|--------------|
| **Minikube** | ≥ 1.30.0 | Local Kubernetes cluster | [Install Guide](https://minikube.sigs.k8s.io/docs/start/) |
| **kubectl** | ≥ 1.27.0 | Kubernetes CLI | [Install Guide](https://kubernetes.io/docs/tasks/tools/) |
| **Docker** | ≥ 20.10.0 | Container runtime | [Install Guide](https://docs.docker.com/get-docker/) |

### Verify Installation

```bash
# Check Minikube
minikube version
# Expected: minikube version: v1.30.0 or higher

# Check kubectl
kubectl version --client
# Expected: Client Version: v1.27.0 or higher

# Check Docker
docker --version
# Expected: Docker version 20.10.0 or higher
```

### System Requirements

- **CPU**: 4 cores (minimum 2)
- **RAM**: 4GB (minimum 2GB)
- **Disk**: 20GB free space
- **OS**: Windows 10/11, macOS 10.13+, Linux

---

## 🔧 First Time Setup

### Step 1: Configure Secrets

1. **Copy the template:**
   ```bash
   cp .env.secrets.example .env.secrets
   ```

2. **Edit `.env.secrets`** with your actual values:

   ```bash
   # Database URL (Neon PostgreSQL or any PostgreSQL provider)
   DATABASE_URL="postgresql://user:password@ep-xxx.aws.neon.tech/todo_db?sslmode=require"

   # Auth Secret (43 characters, must match frontend and backend)
   # Generate with: python -c "import secrets; print(secrets.token_urlsafe(32))"
   BETTER_AUTH_SECRET="DicJ0mbjX2VmhOMYzT2vAEn5f5JPEwPVZgEIB6Cy07A"

   # OpenAI API Key (for AI chatbot features)
   OPENAI_API_KEY="sk-proj-your-actual-openai-key-here"
   ```

3. **Verify `.env.secrets` is in `.gitignore`:**
   ```bash
   grep ".env.secrets" .gitignore
   # Should return: .env.secrets
   ```

### Step 2: Run Deployment Script

**Linux/macOS:**
```bash
chmod +x deploy-to-minikube.sh
./deploy-to-minikube.sh
```

**Windows (PowerShell):**
```powershell
.\deploy-to-minikube.ps1
```

### What the Script Does

1. ✅ Checks prerequisites (minikube, kubectl, docker)
2. ✅ Loads environment variables from `.env.secrets`
3. ✅ Starts Minikube cluster
4. ✅ Builds Docker images (backend + frontend)
5. ✅ Creates Kubernetes namespace (`todo-app`)
6. ✅ Creates Kubernetes secrets
7. ✅ Deploys application (backend + frontend pods)
8. ✅ Waits for pods to be ready
9. ✅ Sets up port-forwarding (3000, 8000)
10. ✅ Runs health checks

### Expected Output

```
==========================================
  Todo App - Minikube Deployment
==========================================

ℹ  Checking prerequisites...
✓  All prerequisites are installed

ℹ  Loading environment variables...
✓  Environment variables loaded

ℹ  Starting Minikube...
✓  Minikube started

ℹ  Building Docker images in Minikube environment...
ℹ  Building backend image...
✓  Backend image built
ℹ  Building frontend image...
✓  Frontend image built

ℹ  Creating Kubernetes namespace...
✓  Namespace created/verified

ℹ  Creating Kubernetes secrets...
✓  Secrets created

ℹ  Deploying application to Kubernetes...
✓  Deployment manifests applied

ℹ  Waiting for pods to be ready (this may take 2-3 minutes)...
✓  Backend pod is ready
✓  Frontend pod is ready

ℹ  Setting up port-forwarding...
✓  Port-forwarding established

ℹ  Running health checks...
✓  Backend is healthy
✓  Frontend is accessible

==========================================
  Deployment Complete! 🎉
==========================================

📍 Access your application:
   Frontend:   http://localhost:3000
   Backend:    http://localhost:8000
   API Docs:   http://localhost:8000/docs
```

---

## 🏃 Daily Usage

### Starting the App (Already Deployed)

Use the quick-start script when the app is already deployed:

```bash
./quick-start.sh
```

This script:
- ✅ Starts Minikube (if stopped)
- ✅ Verifies pods are ready
- ✅ Sets up port-forwarding
- ✅ Runs health checks

**Much faster than full deployment** (30 seconds vs 5 minutes)

### Stopping the App

**Option 1: Stop Port-Forwarding Only** (pods keep running)
```bash
# Press Ctrl+C in the terminal running port-forwarding
# Or kill the processes
pkill -f "kubectl port-forward.*todo-app"
```

**Option 2: Stop Minikube** (full shutdown)
```bash
minikube stop
```

**Option 3: Delete Everything** (clean slate)
```bash
kubectl delete namespace todo-app
minikube delete
```

### Viewing Logs

```bash
# Backend logs (live)
kubectl logs -f deployment/todo-app-backend -n todo-app

# Frontend logs (live)
kubectl logs -f deployment/todo-app-frontend -n todo-app

# View last 50 lines
kubectl logs --tail=50 deployment/todo-app-backend -n todo-app

# View logs from all pods
kubectl logs -l app=todo-app-backend -n todo-app --all-containers
```

### Restarting Services

```bash
# Restart backend only
kubectl rollout restart deployment/todo-app-backend -n todo-app

# Restart frontend only
kubectl rollout restart deployment/todo-app-frontend -n todo-app

# Restart both
kubectl rollout restart deployment -n todo-app
```

---

## 🏗️ Architecture

### Kubernetes Resources

```
todo-app (Namespace)
├── Deployments
│   ├── todo-app-backend (1 replica)
│   └── todo-app-frontend (1 replica)
├── Services (ClusterIP)
│   ├── todo-app-backend:8000
│   └── todo-app-frontend:3000
└── Secrets
    └── todo-app-secrets
        ├── database-url
        ├── better-auth-secret
        └── openai-api-key
```

### Network Flow

```
Browser (localhost:3000)
    ↓ [port-forward]
Frontend Pod (todo-app-frontend:3000)
    ↓ [ClusterIP Service]
Backend Pod (todo-app-backend:8000)
    ↓ [Internet]
Neon PostgreSQL (Cloud Database)
```

### Docker Images

| Image | Size | Base | Purpose |
|-------|------|------|---------|
| `todo-app-backend:latest` | ~349MB | python:3.11-slim | FastAPI REST API |
| `todo-app-frontend:latest` | ~208MB | node:20-alpine | Next.js Web UI |

### Environment Variables

**Backend Pod:**
- `DATABASE_URL` (from secret)
- `BETTER_AUTH_SECRET` (from secret)
- `OPENAI_API_KEY` (from secret)
- `BETTER_AUTH_URL=http://localhost:8000/api/auth`
- `FRONTEND_URL=http://localhost:3000`

**Frontend Pod:**
- `NEXT_PUBLIC_API_URL=http://localhost:8000` (build-time)
- `NEXT_PUBLIC_BETTER_AUTH_SECRET` (from secret, build-time)
- `NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000/api/auth` (build-time)

---

## 🔍 Troubleshooting

### Issue 1: Minikube Won't Start

**Symptoms:**
```
minikube start
❌ Exiting due to HOST_VIRT_UNAVAILABLE
```

**Solutions:**
```bash
# Try different driver
minikube start --driver=virtualbox  # or hyperkit, kvm2, etc.

# Reset Minikube
minikube delete
minikube start

# Check system virtualization
# Windows: Enable Hyper-V or WSL2
# macOS: Check if HyperKit or VirtualBox is installed
# Linux: Check if KVM is enabled
```

### Issue 2: Pods Not Starting

**Symptoms:**
```bash
kubectl get pods -n todo-app
# NAME                                 READY   STATUS             RESTARTS   AGE
# todo-app-backend-xxx                 0/1     ImagePullBackOff   0          2m
```

**Solutions:**
```bash
# Check pod details
kubectl describe pod <pod-name> -n todo-app

# Common fixes:

# 1. Image not found (rebuild)
eval $(minikube docker-env)
./deploy-to-minikube.sh

# 2. Secrets missing
kubectl get secrets -n todo-app
# If empty, rerun deployment script

# 3. Check logs
kubectl logs <pod-name> -n todo-app
```

### Issue 3: Port-Forwarding Fails

**Symptoms:**
```
error: lost connection to pod
```

**Solutions:**
```bash
# Kill existing port-forwards
pkill -f "kubectl port-forward"

# Restart port-forwarding manually
kubectl port-forward -n todo-app svc/todo-app-backend 8000:8000 &
kubectl port-forward -n todo-app svc/todo-app-frontend 3000:3000 &

# Or use quick-start script
./quick-start.sh
```

### Issue 4: Frontend Can't Connect to Backend

**Symptoms:**
- Frontend loads but shows "Failed to fetch" errors
- Browser console shows `ERR_NAME_NOT_RESOLVED`

**Root Cause:**
Frontend image was built with wrong `NEXT_PUBLIC_API_URL`

**Fix:**
```bash
# Rebuild frontend with correct URL
eval $(minikube docker-env)

docker build \
  --build-arg NEXT_PUBLIC_API_URL="http://localhost:8000" \
  --build-arg NEXT_PUBLIC_BETTER_AUTH_SECRET="<your-secret>" \
  --build-arg NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000/api/auth" \
  -t todo-app-frontend:latest \
  ./frontend-web

# Restart frontend deployment
kubectl rollout restart deployment/todo-app-frontend -n todo-app
```

### Issue 5: Database Connection Errors

**Symptoms:**
```
Backend logs show: could not connect to server: Connection refused
```

**Solutions:**
```bash
# 1. Verify DATABASE_URL in .env.secrets
cat .env.secrets | grep DATABASE_URL

# 2. Test database connection (from local machine)
psql "<your-database-url>"

# 3. Update secret in Kubernetes
kubectl delete secret todo-app-secrets -n todo-app
kubectl create secret generic todo-app-secrets \
  --from-literal="database-url=<new-url>" \
  --from-literal="better-auth-secret=<secret>" \
  --from-literal="openai-api-key=<key>" \
  --namespace=todo-app

# 4. Restart backend
kubectl rollout restart deployment/todo-app-backend -n todo-app
```

---

## 🎯 Advanced Usage

### Scaling

```bash
# Scale backend to 3 replicas
kubectl scale deployment/todo-app-backend --replicas=3 -n todo-app

# Scale frontend to 2 replicas
kubectl scale deployment/todo-app-frontend --replicas=2 -n todo-app

# Verify
kubectl get pods -n todo-app
```

### Resource Monitoring

```bash
# View resource usage
kubectl top pods -n todo-app
kubectl top nodes

# Detailed pod info
kubectl describe pod <pod-name> -n todo-app
```

### Accessing Minikube Dashboard

```bash
minikube dashboard
```

Opens Kubernetes dashboard in browser with visual interface.

### Updating Application

```bash
# 1. Make code changes

# 2. Rebuild images
eval $(minikube docker-env)
docker build -t todo-app-backend:latest ./backend
docker build -t todo-app-frontend:latest ./frontend-web

# 3. Restart deployments (triggers new pods with new images)
kubectl rollout restart deployment/todo-app-backend -n todo-app
kubectl rollout restart deployment/todo-app-frontend -n todo-app

# 4. Watch rollout status
kubectl rollout status deployment/todo-app-backend -n todo-app
```

### Cleaning Up

```bash
# Delete application but keep Minikube
kubectl delete namespace todo-app

# Stop Minikube
minikube stop

# Delete Minikube cluster (complete cleanup)
minikube delete
```

---

## 📚 Additional Resources

- **Minikube Docs**: https://minikube.sigs.k8s.io/docs/
- **kubectl Cheat Sheet**: https://kubernetes.io/docs/reference/kubectl/cheatsheet/
- **Kubernetes Tutorials**: https://kubernetes.io/docs/tutorials/

---

## 🆘 Getting Help

If you encounter issues not covered here:

1. **Check pod logs**: `kubectl logs -f deployment/todo-app-backend -n todo-app`
2. **Check pod status**: `kubectl describe pod <pod-name> -n todo-app`
3. **Check Minikube logs**: `minikube logs`
4. **Search GitHub issues**: [Project Issues](https://github.com/your-repo/issues)

---

**Last Updated**: 2026-01-08
**Kubernetes Version**: 1.27+
**Minikube Version**: 1.30+
