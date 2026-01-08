# Security Scan Documentation

**Phase IV: Kubernetes Deployment - Docker Image Security**

This document describes the security scanning process for Docker images used in Kubernetes deployment.

---

## Overview

Security scanning is performed using **Trivy**, an open-source vulnerability scanner for containers and other artifacts.

**Trivy scans for:**
- Known CVEs (Common Vulnerabilities and Exposures)
- Outdated packages
- Security misconfigurations
- Secrets in images (API keys, passwords)
- License compliance issues

---

## Installation

### Windows (Chocolatey)

```powershell
choco install trivy
```

### Windows (Scoop)

```powershell
scoop install trivy
```

### Linux/WSL (Debian/Ubuntu)

```bash
sudo apt-get install wget apt-transport-https gnupg lsb-release
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | gpg --dearmor | sudo tee /usr/share/keyrings/trivy.gpg > /dev/null
echo "deb [signed-by=/usr/share/keyrings/trivy.gpg] https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | sudo tee -a /etc/apt/sources.list.d/trivy.list
sudo apt-get update
sudo apt-get install trivy
```

### macOS (Homebrew)

```bash
brew install trivy
```

### Verify Installation

```bash
trivy --version
```

---

## Running Security Scans

### Automated Scan (Recommended)

**Use the provided script:**

```bash
bash scripts/security-scan.sh
```

**This script will:**
1. Check if Trivy is installed
2. Update vulnerability database
3. Configure Minikube Docker environment
4. Scan all 3 images:
   - `todo-backend:latest`
   - `todo-frontend-web:latest`
   - `todo-frontend-chatbot:latest`
5. Generate detailed reports
6. Create summary with vulnerability counts
7. Exit with error if CRITICAL vulnerabilities found

**Output:**
- Individual reports: `security-reports/<image>-<timestamp>.txt`
- JSON reports: `security-reports/<image>-<timestamp>.json`
- Summary: `security-reports/summary-<timestamp>.txt`

---

### Manual Scan

**Scan a single image:**

```bash
# Configure Minikube Docker
eval $(minikube docker-env)

# Scan backend
trivy image todo-backend:latest

# Scan with severity filter
trivy image --severity CRITICAL,HIGH todo-backend:latest

# Save to file
trivy image --severity CRITICAL,HIGH --output backend-scan.txt todo-backend:latest

# JSON format for automation
trivy image --format json --output backend-scan.json todo-backend:latest
```

---

## Severity Levels

| Level | Description | Action Required |
|-------|-------------|-----------------|
| **CRITICAL** | Actively exploited or severe impact | **Immediate remediation** |
| **HIGH** | Significant risk, should be patched | **Plan remediation within 1 week** |
| **MEDIUM** | Moderate risk | **Address in next sprint** |
| **LOW** | Minimal risk | **Address when convenient** |
| **UNKNOWN** | Severity not determined | **Review manually** |

---

## Common Vulnerabilities

### 1. Outdated Base Images

**Issue:**
```
CVE-2023-XXXXX (CRITICAL)
Package: openssl
Installed Version: 1.1.1k
Fixed Version: 1.1.1w
```

**Solution:**
```dockerfile
# Update base image in Dockerfile
FROM python:3.12-slim  # Use latest patch version
```

**Rebuild:**
```bash
eval $(minikube docker-env)
docker build -t todo-backend:latest -f docker/backend.Dockerfile ./backend
```

---

### 2. Vulnerable Python Packages

**Issue:**
```
CVE-2024-XXXXX (HIGH)
Package: fastapi
Installed Version: 0.100.0
Fixed Version: 0.111.0
```

**Solution:**
```bash
# Update requirements.txt
fastapi==0.111.0  # Bump to fixed version

# Or use latest
pip install --upgrade fastapi
pip freeze > backend/requirements.txt
```

**Rebuild:**
```bash
docker build -t todo-backend:latest -f docker/backend.Dockerfile ./backend
```

---

### 3. Vulnerable Node.js Packages

**Issue:**
```
CVE-2024-XXXXX (CRITICAL)
Package: next
Installed Version: 14.0.0
Fixed Version: 14.2.5
```

**Solution:**
```bash
cd frontend-web
npm update next

# Or specific version
npm install next@14.2.5

# Verify
npm audit
npm audit fix
```

**Rebuild:**
```bash
docker build -t todo-frontend-web:latest -f docker/frontend-web.Dockerfile ./frontend-web
```

---

### 4. Secrets in Images

**Issue:**
```
SECRET DETECTED
Type: AWS Access Key
File: /app/.env
```

**Solution:**
```dockerfile
# NEVER include .env in Docker images!

# Add to .dockerignore
.env
.env.local
**/.env
```

**Best Practices:**
- Use Kubernetes Secrets (already implemented)
- Never hardcode secrets in source code
- Use `.dockerignore` to exclude sensitive files
- Scan images before deployment

---

## Remediation Workflow

### Step 1: Scan Images

```bash
bash scripts/security-scan.sh
```

### Step 2: Review Reports

```bash
# View summary
cat security-reports/summary-<timestamp>.txt

# View detailed report
cat security-reports/todo-backend-latest-<timestamp>.txt
```

### Step 3: Update Dependencies

**Backend (Python):**
```bash
cd backend
pip install --upgrade <package>
pip freeze > requirements.txt
```

**Frontend (Node.js):**
```bash
cd frontend-web
npm update <package>
npm audit fix
```

### Step 4: Rebuild Images

```bash
eval $(minikube docker-env)
docker build -t todo-backend:latest -f docker/backend.Dockerfile ./backend
docker build -t todo-frontend-web:latest -f docker/frontend-web.Dockerfile ./frontend-web
docker build -t todo-frontend-chatbot:latest -f docker/frontend-chatbot.Dockerfile ./frontend-chatbot
```

### Step 5: Re-scan

```bash
bash scripts/security-scan.sh
```

### Step 6: Deploy Updated Images

```bash
# Rolling update
helm upgrade todo-app ./helm-charts/todo-app -f ./helm-charts/todo-app/values-dev.yaml

# Or restart deployments
kubectl rollout restart deployment/todo-app-backend
kubectl rollout restart deployment/todo-app-frontend-web
kubectl rollout restart deployment/todo-app-frontend-chatbot
```

### Step 7: Verify

```bash
# Check pod status
kubectl get pods

# Run health checks
bash scripts/health-check.sh
```

---

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Security Scan

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 0'  # Weekly

jobs:
  trivy-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build Backend Image
        run: |
          docker build -t todo-backend:latest -f docker/backend.Dockerfile ./backend

      - name: Run Trivy Scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'todo-backend:latest'
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'

      - name: Upload Results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

      - name: Fail on Critical
        run: |
          trivy image --exit-code 1 --severity CRITICAL todo-backend:latest
```

---

## Security Best Practices

### 1. Regular Scanning

- **Before deployment**: Scan all images
- **Weekly**: Automated scans via CI/CD
- **After dependency updates**: Re-scan to verify fixes

### 2. Multi-Stage Docker Builds

```dockerfile
# Build stage (larger, includes build tools)
FROM python:3.12 AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Runtime stage (smaller, minimal attack surface)
FROM python:3.12-slim
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY . .
CMD ["uvicorn", "src.api.main:app"]
```

**Benefits:**
- Smaller image size
- Fewer packages → fewer vulnerabilities
- No build tools in production image

### 3. Use Official Base Images

```dockerfile
# ✅ Good
FROM python:3.12-slim

# ✅ Good
FROM node:20-alpine

# ❌ Avoid
FROM ubuntu:latest
RUN apt-get install python3
```

### 4. Keep Images Up-to-Date

```bash
# Pull latest base images
docker pull python:3.12-slim
docker pull node:20-alpine

# Rebuild with latest
docker build --no-cache -t todo-backend:latest -f docker/backend.Dockerfile ./backend
```

### 5. Use `.dockerignore`

```
# Exclude sensitive files
.env
.env.local
**/.env
*.key
*.pem
secrets/

# Exclude development files
.git
.gitignore
node_modules
__pycache__
*.pyc
```

---

## Scan Results Interpretation

### Example Report

```
todo-backend:latest (python 3.12-slim)
===================================
Total: 15 (CRITICAL: 2, HIGH: 5, MEDIUM: 8)

┌────────────┬────────────────┬──────────┬───────────────────┬───────────────────┬────────────────┐
│  Library   │ Vulnerability  │ Severity │ Installed Version │   Fixed Version   │     Title      │
├────────────┼────────────────┼──────────┼───────────────────┼───────────────────┼────────────────┤
│ openssl    │ CVE-2023-12345 │ CRITICAL │ 1.1.1k            │ 1.1.1w            │ Buffer overflow│
│ fastapi    │ CVE-2024-67890 │ HIGH     │ 0.100.0           │ 0.111.0           │ XSS vulnerability│
└────────────┴────────────────┴──────────┴───────────────────┴───────────────────┴────────────────┘
```

**Interpretation:**
1. **CRITICAL: 2** → Immediate action required
2. **HIGH: 5** → Plan remediation this week
3. **MEDIUM: 8** → Address in next sprint

**Action Plan:**
1. Update `openssl` (rebuild base image or update package)
2. Update `fastapi` to 0.111.0 in `requirements.txt`
3. Rebuild image and re-scan

---

## Status (Phase IV Implementation)

### Current Status

| Task | Status | Notes |
|------|--------|-------|
| Trivy installation script | ✅ Created | `scripts/security-scan.sh` |
| Security scan documentation | ✅ Created | `docs/SECURITY_SCAN.md` |
| Automated scan script | ✅ Created | Scans all 3 images |
| Initial scan | ⏸️ Pending | Requires Trivy installation |
| Remediation | ⏸️ Pending | Depends on scan results |

**Next Steps:**
1. Install Trivy on development machine
2. Run initial scan: `bash scripts/security-scan.sh`
3. Review vulnerability reports
4. Create remediation plan for CRITICAL and HIGH issues
5. Update dependencies and rebuild images
6. Re-scan to verify fixes
7. Document findings in ADR (if architectural changes needed)

---

## Additional Resources

- **Trivy Documentation:** https://aquasecurity.github.io/trivy/
- **CVE Database:** https://cve.mitre.org/
- **NIST NVD:** https://nvd.nist.gov/
- **Docker Security Best Practices:** https://docs.docker.com/develop/security-best-practices/
- **OWASP Container Security:** https://owasp.org/www-project-docker-top-10/

---

## Compliance & Reporting

### Vulnerability Tracking

Create a spreadsheet or issue tracker:

| CVE ID | Severity | Package | Current | Fixed | Status | ETA |
|--------|----------|---------|---------|-------|--------|-----|
| CVE-2023-12345 | CRITICAL | openssl | 1.1.1k | 1.1.1w | In Progress | 2025-01-06 |
| CVE-2024-67890 | HIGH | fastapi | 0.100.0 | 0.111.0 | Planned | 2025-01-08 |

### Reporting Cadence

- **Daily:** Monitor for new critical vulnerabilities
- **Weekly:** Run automated scans
- **Monthly:** Generate compliance report
- **Quarterly:** Review and update security policies

---

**Security Scan Documentation Complete** | Phase IV: Kubernetes Deployment
