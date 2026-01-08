# 🚀 Kubernetes Quick Start Guide

**Get your Todo App running on Minikube in 3 steps!**

---

## ⚡ First Time Setup (5 minutes)

### Step 1: Install Prerequisites

```bash
# Check if already installed
minikube version  # Need 1.30+
kubectl version   # Need 1.27+
docker --version  # Need 20.10+
```

**Not installed?** Visit: https://minikube.sigs.k8s.io/docs/start/

### Step 2: Configure Secrets

```bash
# Copy the template
cp .env.secrets.example .env.secrets

# Edit with your actual credentials
# Use any text editor: nano, vim, code, notepad++
nano .env.secrets
```

**Required values:**
- `DATABASE_URL` - Your PostgreSQL connection string (Neon or other)
- `BETTER_AUTH_SECRET` - 43-character secret (generate with provided command)
- `OPENAI_API_KEY` - Your OpenAI API key

### Step 3: Deploy

**Linux/macOS:**
```bash
chmod +x deploy-to-minikube.sh
./deploy-to-minikube.sh
```

**Windows (PowerShell):**
```powershell
.\deploy-to-minikube.ps1
```

**Expected time:** 3-5 minutes (first time)

---

## 🏃 Daily Use (After First Setup)

### Start the App

```bash
./quick-start.sh   # Linux/macOS
```

```powershell
.\quick-start.ps1  # Windows
```

**Expected time:** 30 seconds

### Access Your App

Once started, open in your browser:

- **Web UI**: http://localhost:3000
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Stop the App

```bash
# Press Ctrl+C in the terminal running port-forwarding
```

Or:

```bash
minikube stop  # Full shutdown
```

---

## 🛠️ Common Tasks

### View Logs

```bash
# Backend logs
kubectl logs -f deployment/todo-app-backend -n todo-app

# Frontend logs
kubectl logs -f deployment/todo-app-frontend -n todo-app
```

### Restart Services

```bash
# Restart backend
kubectl rollout restart deployment/todo-app-backend -n todo-app

# Restart frontend
kubectl rollout restart deployment/todo-app-frontend -n todo-app
```

### Check Status

```bash
# View all pods
kubectl get pods -n todo-app

# View services
kubectl get svc -n todo-app

# View deployments
kubectl get deployments -n todo-app
```

### Clean Up

```bash
./cleanup.sh  # Remove all Todo App resources
```

---

## ❓ Troubleshooting

### Pods won't start?

```bash
# Check what's wrong
kubectl get pods -n todo-app
kubectl describe pod <pod-name> -n todo-app
kubectl logs <pod-name> -n todo-app
```

### Port already in use?

```bash
# Kill existing port-forwards
pkill -f "kubectl port-forward"

# Restart
./quick-start.sh
```

### Need to rebuild?

```bash
# Full redeployment
./deploy-to-minikube.sh
```

---

## 📚 Full Documentation

For complete details, see:
- **Complete Guide**: [KUBERNETES-DEPLOYMENT.md](./KUBERNETES-DEPLOYMENT.md)
- **Quick Reference**: [README-DEPLOYMENT.md](./README-DEPLOYMENT.md)

---

## 📂 What Got Deployed?

```
Minikube Cluster
├── Namespace: todo-app
│   ├── Backend Pod (FastAPI)
│   ├── Frontend Pod (Next.js)
│   ├── Backend Service (ClusterIP)
│   ├── Frontend Service (ClusterIP)
│   └── Secrets (database, auth, API keys)
└── Port Forwarding
    ├── localhost:3000 → Frontend
    └── localhost:8000 → Backend
```

---

## 🎯 Next Steps

1. **Open Frontend**: http://localhost:3000
2. **Sign Up**: Create a new account
3. **Add Tasks**: Start managing your todos!

---

**Need Help?** Check [KUBERNETES-DEPLOYMENT.md](./KUBERNETES-DEPLOYMENT.md) for detailed troubleshooting.
