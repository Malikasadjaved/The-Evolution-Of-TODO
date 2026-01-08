# Quick Deployment Guide

🚀 **Get your Todo App running on Kubernetes in 5 minutes!**

## For First-Time Users

### 1. Setup Secrets

```bash
# Copy the example file
cp .env.secrets.example .env.secrets

# Edit and add your actual credentials
nano .env.secrets  # or use any text editor
```

### 2. Deploy Everything

**Linux/macOS:**
```bash
chmod +x deploy-to-minikube.sh
./deploy-to-minikube.sh
```

**Windows:**
```powershell
.\deploy-to-minikube.ps1
```

### 3. Access Your App

Once deployment completes:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## For Daily Use

### Quick Start (App Already Deployed)

```bash
./quick-start.sh   # Linux/macOS
```

```powershell
.\quick-start.ps1  # Windows
```

### Stop the App

```bash
# Option 1: Stop port-forwarding (pods keep running)
Ctrl+C in the terminal

# Option 2: Stop Minikube completely
minikube stop

# Option 3: Delete everything
./cleanup.sh
```

---

## Available Scripts

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `deploy-to-minikube.sh` | Full deployment | First time or after major changes |
| `quick-start.sh` | Start services only | Daily use when already deployed |
| `cleanup.sh` | Remove all resources | Clean up or fresh start |

---

## Troubleshooting

### App won't start?

```bash
# Check pod status
kubectl get pods -n todo-app

# View logs
kubectl logs -f deployment/todo-app-backend -n todo-app
```

### Port already in use?

```bash
# Kill existing port-forwards
pkill -f "kubectl port-forward"
```

### Need to rebuild?

```bash
# Rebuild and restart
eval $(minikube docker-env)
docker build -t todo-app-backend:latest ./backend
kubectl rollout restart deployment/todo-app-backend -n todo-app
```

---

## Full Documentation

See [KUBERNETES-DEPLOYMENT.md](./KUBERNETES-DEPLOYMENT.md) for complete documentation.

---

## Architecture

```
Browser → Port-Forward → Frontend Pod → Backend Pod → Database (Cloud)
          (localhost:3000)   (K8s)       (K8s)        (Neon)
```

---

## Prerequisites

- Minikube 1.30+
- kubectl 1.27+
- Docker 20.10+

Install from: https://minikube.sigs.k8s.io/docs/start/

---

**Need Help?** Check the troubleshooting section in [KUBERNETES-DEPLOYMENT.md](./KUBERNETES-DEPLOYMENT.md)
