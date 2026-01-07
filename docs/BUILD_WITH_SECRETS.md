# Building Docker Images with Secrets

This guide explains how to build Docker images that require secrets (like JWT signing keys) without committing them to the repository.

## Security Policy

🔒 **NEVER commit secrets to Git!**
- Secrets are passed at **build time** via `--build-arg`
- Secrets are stored in **Kubernetes Secrets** for runtime
- `.env` files are git-ignored (see `.gitignore`)

---

## Frontend Web (Next.js)

### Local Docker Build

```bash
# Build with secret from environment variable
docker build \
  --build-arg NEXT_PUBLIC_BETTER_AUTH_SECRET="${BETTER_AUTH_SECRET}" \
  --build-arg NEXT_PUBLIC_API_URL="http://localhost:8000" \
  --build-arg NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000/api/auth" \
  -t todo-frontend-web:latest \
  ./frontend-web
```

### Minikube Build

```bash
# Option 1: Build inside Minikube with secret from file
export BETTER_AUTH_SECRET=$(grep BETTER_AUTH_SECRET frontend-web/.env.local | cut -d'"' -f2)

minikube image build \
  --build-arg NEXT_PUBLIC_BETTER_AUTH_SECRET="${BETTER_AUTH_SECRET}" \
  --build-arg NEXT_PUBLIC_API_URL="http://todo-app-backend:8000" \
  --build-arg NEXT_PUBLIC_BETTER_AUTH_URL="http://todo-app-frontend:3000/api/auth" \
  -t todo-frontend-web:latest \
  ./frontend-web

# Option 2: Use script (recommended)
./scripts/build-minikube-images.sh
```

---

## Backend (FastAPI)

### Local Docker Build

```bash
docker build \
  -t todo-backend:latest \
  ./backend
```

**Note**: Backend uses environment variables at runtime (not build time), so no build args needed.

---

## Kubernetes Secrets Management

### Create Secrets

```bash
# Frontend secrets (already created)
kubectl create secret generic frontend-secrets \
  --from-literal=BETTER_AUTH_SECRET="your-43-char-secret-here" \
  -n todo-app

# Backend secrets (if needed)
kubectl create secret generic backend-secrets \
  --from-literal=DATABASE_URL="postgresql://..." \
  --from-literal=BETTER_AUTH_SECRET="your-43-char-secret-here" \
  --from-literal=OPENAI_API_KEY="sk-..." \
  -n todo-app
```

### View Secrets (Base64 Encoded)

```bash
# List secrets
kubectl get secrets -n todo-app

# View secret content (base64 encoded)
kubectl get secret frontend-secrets -n todo-app -o yaml

# Decode specific key
kubectl get secret frontend-secrets -n todo-app -o jsonpath='{.data.BETTER_AUTH_SECRET}' | base64 -d
```

### Update Secrets

```bash
# Delete old secret
kubectl delete secret frontend-secrets -n todo-app

# Create new one
kubectl create secret generic frontend-secrets \
  --from-literal=BETTER_AUTH_SECRET="new-secret-value" \
  -n todo-app

# Restart pods to pick up new secret
kubectl rollout restart deployment frontend-web -n todo-app
```

---

## Environment Variables Summary

### Frontend Web (Build-time ARGs)
| Variable | Purpose | Example |
|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API endpoint | `http://todo-app-backend:8000` |
| `NEXT_PUBLIC_BETTER_AUTH_SECRET` | JWT signing secret (43 chars) | `DicJ0m...` |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | Frontend auth endpoint | `http://todo-app-frontend:3000/api/auth` |

### Backend (Runtime ENV)
| Variable | Purpose | Source |
|----------|---------|--------|
| `DATABASE_URL` | PostgreSQL connection | Kubernetes Secret |
| `BETTER_AUTH_SECRET` | JWT signing secret | Kubernetes Secret |
| `OPENAI_API_KEY` | OpenAI API key | Kubernetes Secret |

---

## Automated Build Script

Create `scripts/build-minikube-images.sh`:

```bash
#!/bin/bash
set -e

echo "🔨 Building images for Minikube..."

# Load secret from .env.local
export BETTER_AUTH_SECRET=$(grep NEXT_PUBLIC_BETTER_AUTH_SECRET frontend-web/.env.local | cut -d'"' -f2)

if [ -z "$BETTER_AUTH_SECRET" ]; then
  echo "❌ Error: BETTER_AUTH_SECRET not found in frontend-web/.env.local"
  exit 1
fi

# Build backend
echo "📦 Building backend..."
minikube image build -t todo-backend:latest ./backend

# Build frontend-web
echo "📦 Building frontend-web..."
minikube image build \
  --build-arg NEXT_PUBLIC_BETTER_AUTH_SECRET="${BETTER_AUTH_SECRET}" \
  --build-arg NEXT_PUBLIC_API_URL="http://todo-app-backend:8000" \
  --build-arg NEXT_PUBLIC_BETTER_AUTH_URL="http://todo-app-frontend:3000/api/auth" \
  -t todo-frontend-web:latest \
  ./frontend-web

# Build frontend-chatbot (if needed)
echo "📦 Building frontend-chatbot..."
minikube image build -t todo-frontend-chatbot:latest ./frontend-chatbot

echo "✅ All images built successfully!"
echo ""
echo "Next steps:"
echo "1. kubectl apply -f k8s/"
echo "2. kubectl rollout restart deployment -n todo-app"
```

Make it executable:
```bash
chmod +x scripts/build-minikube-images.sh
```

---

## Security Best Practices

### ✅ DO:
- Use `--build-arg` to pass secrets at build time
- Store secrets in Kubernetes Secrets for runtime
- Use `.env.example` files with placeholder values
- Rotate secrets regularly
- Use different secrets for dev/staging/prod

### ❌ DON'T:
- Commit `.env` files to Git
- Hardcode secrets in Dockerfiles
- Use default/example secrets in production
- Share secrets in plain text (Slack, email, etc.)
- Reuse secrets across environments

---

## Troubleshooting

### Build fails: "BETTER_AUTH_SECRET is not set"
```bash
# Check if variable is exported
echo $BETTER_AUTH_SECRET

# If empty, load from .env.local
export BETTER_AUTH_SECRET=$(grep NEXT_PUBLIC_BETTER_AUTH_SECRET frontend-web/.env.local | cut -d'"' -f2)
```

### Pods fail: "Error: BETTER_AUTH_SECRET must be at least 32 characters"
```bash
# Check secret length
kubectl get secret frontend-secrets -n todo-app -o jsonpath='{.data.BETTER_AUTH_SECRET}' | base64 -d | wc -c

# Should output: 43 (or at least 32)
```

### Secret exists but pods can't read it
```bash
# Verify secret is in correct namespace
kubectl get secrets -n todo-app

# Check deployment references correct secret name
kubectl get deployment frontend-web -n todo-app -o yaml | grep -A5 secretKeyRef
```

---

## Quick Reference

```bash
# Rebuild all images
./scripts/build-minikube-images.sh

# Restart deployments to pick up new images
kubectl rollout restart deployment -n todo-app

# Check secret values (debugging only)
kubectl get secret frontend-secrets -n todo-app -o jsonpath='{.data.BETTER_AUTH_SECRET}' | base64 -d

# Verify pods are using correct image
kubectl get pods -n todo-app -o jsonpath='{.items[*].spec.containers[*].image}'
```

---

**Last Updated**: 2026-01-07
**Status**: ✅ Secrets properly configured in Kubernetes
