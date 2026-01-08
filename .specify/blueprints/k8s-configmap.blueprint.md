# Blueprint: Kubernetes ConfigMap

**Purpose:** Standard pattern for managing non-sensitive configuration data in Kubernetes, separating configuration from application code.

**When to Use:**
- Storing environment-specific configuration (dev, staging, prod)
- Externalizing application settings (log levels, feature flags, URLs)
- Sharing configuration across multiple pods
- Avoiding hardcoded configuration in container images

**Phase IV Constitution Reference:** Section VII (Infrastructure as Code), Section X (Security & Secrets Management)

---

## ConfigMap vs Secret Decision Matrix

| Data Type | Use | Example | Storage |
|-----------|-----|---------|---------|
| **Non-Sensitive** | ConfigMap | LOG_LEVEL, FRONTEND_URL, ENVIRONMENT | Plain text |
| **Sensitive** | Secret | DATABASE_URL, API_KEYS, PASSWORDS | Base64 encoded |

**CRITICAL:** Never store secrets in ConfigMaps! Use Kubernetes Secrets instead.

---

## Pattern 1: Literal Key-Value Pairs

**Use For:** Simple key-value configuration

### Imperative Creation (Quick)
```bash
kubectl create configmap <app-name>-config \
  --from-literal=ENVIRONMENT=development \
  --from-literal=LOG_LEVEL=INFO \
  --from-literal=FRONTEND_URL=http://localhost:3000 \
  --from-literal=DEBUG_MODE=true
```

### Declarative YAML (Preferred for GitOps)
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: <app-name>-config
  labels:
    app: <app-name>
    phase: <phase-number>
data:
  ENVIRONMENT: "development"
  LOG_LEVEL: "INFO"
  FRONTEND_URL: "http://localhost:3000"
  DEBUG_MODE: "true"
```

**Apply:**
```bash
kubectl apply -f k8s/configmap.yaml
```

---

## Pattern 2: Configuration File

**Use For:** Complex configuration (JSON, YAML, TOML, INI files)

### From File (Imperative)
```bash
kubectl create configmap <app-name>-config \
  --from-file=app.config=/path/to/config.yaml \
  --from-file=logging.config=/path/to/logging.yaml
```

### Declarative YAML
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: <app-name>-config
  labels:
    app: <app-name>
data:
  app.config: |
    server:
      host: 0.0.0.0
      port: 8000
      workers: 4
    database:
      pool_size: 10
      timeout: 30
    features:
      enable_analytics: true
      enable_caching: false

  logging.config: |
    version: 1
    formatters:
      default:
        format: "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    handlers:
      console:
        class: logging.StreamHandler
        formatter: default
    root:
      level: INFO
      handlers: [console]
```

---

## Pattern 3: Environment-Specific ConfigMaps

**Use For:** Different settings per environment

### Development ConfigMap
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: todo-app-config-dev
  labels:
    app: todo-app
    environment: development
data:
  ENVIRONMENT: "development"
  LOG_LEVEL: "DEBUG"
  FRONTEND_URL: "http://localhost:3000"
  BACKEND_URL: "http://todo-app-backend:8000"
  ENABLE_DEBUG: "true"
  ENABLE_PROFILING: "true"
  CORS_ORIGINS: '["http://localhost:3000", "http://localhost:3001"]'
```

### Production ConfigMap
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: todo-app-config-prod
  labels:
    app: todo-app
    environment: production
data:
  ENVIRONMENT: "production"
  LOG_LEVEL: "WARN"
  FRONTEND_URL: "https://todo.example.com"
  BACKEND_URL: "https://api.todo.example.com"
  ENABLE_DEBUG: "false"
  ENABLE_PROFILING: "false"
  CORS_ORIGINS: '["https://todo.example.com"]'
```

---

## Using ConfigMaps in Deployments

### Method 1: Environment Variables (All Keys)

**Inject entire ConfigMap as environment variables:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: todo-app-backend
spec:
  template:
    spec:
      containers:
      - name: backend
        image: todo-backend:latest
        envFrom:
        - configMapRef:
            name: todo-app-config-dev  # All keys become env vars
```

**Result:** All ConfigMap keys available as environment variables in container.

---

### Method 2: Selective Environment Variables

**Inject specific keys as environment variables:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: todo-app-backend
spec:
  template:
    spec:
      containers:
      - name: backend
        image: todo-backend:latest
        env:
        - name: ENVIRONMENT
          valueFrom:
            configMapKeyRef:
              name: todo-app-config-dev
              key: ENVIRONMENT
        - name: LOG_LEVEL
          valueFrom:
            configMapKeyRef:
              name: todo-app-config-dev
              key: LOG_LEVEL
        - name: FRONTEND_URL
          valueFrom:
            configMapKeyRef:
              name: todo-app-config-dev
              key: FRONTEND_URL
```

---

### Method 3: Volume Mount (Configuration Files)

**Mount ConfigMap as file(s) in container:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: todo-app-backend
spec:
  template:
    spec:
      containers:
      - name: backend
        image: todo-backend:latest
        volumeMounts:
        - name: config-volume
          mountPath: /app/config  # Directory where files appear
          readOnly: true
      volumes:
      - name: config-volume
        configMap:
          name: todo-app-config-dev
          items:
          - key: app.config
            path: app.yaml  # File name in /app/config/
          - key: logging.config
            path: logging.yaml
```

**Result:** Files appear at `/app/config/app.yaml` and `/app/config/logging.yaml`

---

### Method 4: Volume Mount (Specific Keys as Files)

**Mount specific keys as separate files:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: todo-app-backend
spec:
  template:
    spec:
      containers:
      - name: backend
        image: todo-backend:latest
        volumeMounts:
        - name: app-config
          mountPath: /app/config/app.yaml
          subPath: app.yaml
          readOnly: true
      volumes:
      - name: app-config
        configMap:
          name: todo-app-config-dev
          items:
          - key: app.config
            path: app.yaml
```

---

## Helm Templating with ConfigMaps

### ConfigMap Template
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "todo-app.fullname" . }}-config
  labels:
    {{- include "todo-app.labels" . | nindent 4 }}
data:
  ENVIRONMENT: {{ .Values.global.environment | quote }}
  LOG_LEVEL: {{ .Values.backend.env.LOG_LEVEL | quote }}
  FRONTEND_URL: {{ .Values.backend.env.FRONTEND_URL | quote }}
  BACKEND_URL: {{ .Values.backend.env.BACKEND_URL | quote }}
  {{- if .Values.backend.env.ENABLE_DEBUG }}
  ENABLE_DEBUG: {{ .Values.backend.env.ENABLE_DEBUG | quote }}
  {{- end }}
```

### Values File (values-dev.yaml)
```yaml
global:
  environment: development

backend:
  env:
    LOG_LEVEL: "INFO"
    FRONTEND_URL: "http://localhost:3000"
    BACKEND_URL: "http://todo-app-backend:8000"
    ENABLE_DEBUG: "true"
```

### Values File (values.yaml - Production)
```yaml
global:
  environment: production

backend:
  env:
    LOG_LEVEL: "WARN"
    FRONTEND_URL: "https://todo.example.com"
    BACKEND_URL: "https://api.todo.example.com"
    ENABLE_DEBUG: "false"
```

---

## Constitution Compliance: Embedded ConfigMaps

**Phase IV Constitution Section IV (Helm Chart Standardization) allows embedding ConfigMaps in deployment templates when configuration is simple and environment-specific.**

### Embedded in Deployment Template
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "todo-app.fullname" . }}-backend
spec:
  template:
    spec:
      containers:
      - name: backend
        env:
        # Direct values (no separate ConfigMap)
        - name: ENVIRONMENT
          value: {{ .Values.global.environment | quote }}
        - name: LOG_LEVEL
          value: {{ .Values.backend.env.LOG_LEVEL | quote }}
        - name: FRONTEND_URL
          value: {{ .Values.backend.env.FRONTEND_URL | quote }}
```

**When to Use Embedded:**
- Simple key-value pairs (5-10 variables)
- Environment-specific values (different per values.yaml)
- No need to share across multiple deployments

**When to Use Separate ConfigMap:**
- Complex configuration (files, multi-line YAML/JSON)
- Shared across multiple deployments
- Frequently updated independently of deployment

---

## Updating ConfigMaps

### Option 1: Recreate (Immutable Pattern)
```bash
# Delete and recreate
kubectl delete configmap <app-name>-config
kubectl apply -f k8s/configmap.yaml

# Restart pods to pick up new config
kubectl rollout restart deployment/<app-name>
```

### Option 2: Edit in Place
```bash
# Edit directly
kubectl edit configmap <app-name>-config

# Restart pods
kubectl rollout restart deployment/<app-name>
```

### Option 3: Immutable ConfigMaps (Recommended)
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: <app-name>-config-v2  # Version in name
immutable: true  # Cannot be modified
data:
  ENVIRONMENT: "production"
  LOG_LEVEL: "WARN"
```

**Benefits:**
- Prevents accidental changes
- Forces explicit versioning
- Rollback-friendly

---

## Validation Commands

```bash
# List ConfigMaps
kubectl get configmaps

# Describe ConfigMap (shows keys)
kubectl describe configmap <app-name>-config

# View ConfigMap YAML
kubectl get configmap <app-name>-config -o yaml

# Check pod environment variables
kubectl exec <pod-name> -- env | sort

# Check mounted files
kubectl exec <pod-name> -- ls -la /app/config
kubectl exec <pod-name> -- cat /app/config/app.yaml
```

---

## Common Patterns

### Pattern: Feature Flags
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: todo-app-feature-flags
data:
  ENABLE_AI_CHATBOT: "true"
  ENABLE_ANALYTICS: "false"
  ENABLE_DARK_MODE: "true"
  MAX_TASKS_PER_USER: "100"
```

### Pattern: External URLs
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: todo-app-urls
data:
  FRONTEND_URL: "http://localhost:3000"
  BACKEND_URL: "http://todo-app-backend:8000"
  NEON_DB_HOST: "ep-example-123456.us-east-2.aws.neon.tech"
  OPENAI_API_URL: "https://api.openai.com/v1"
```

### Pattern: Application Limits
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: todo-app-limits
data:
  MAX_REQUEST_SIZE: "10485760"  # 10MB in bytes
  RATE_LIMIT_REQUESTS: "100"
  RATE_LIMIT_WINDOW: "60"  # seconds
  CONNECTION_POOL_SIZE: "10"
  REQUEST_TIMEOUT: "30"  # seconds
```

---

## Security Best Practices

### ✅ DO:
- Store non-sensitive configuration only
- Use Secrets for DATABASE_URL, API_KEYS, PASSWORDS
- Version ConfigMaps (include version in name)
- Use labels for organization
- Document all keys in README

### ❌ DON'T:
- Store passwords in ConfigMaps (use Secrets)
- Store tokens in ConfigMaps (use Secrets)
- Hardcode ConfigMap names in code (use environment variables)
- Commit sensitive data (use `.gitignore`)

---

## Troubleshooting

### Issue 1: Pod Not Picking Up ConfigMap Changes
**Cause:** Pods don't automatically restart when ConfigMap changes

**Fix:**
```bash
kubectl rollout restart deployment/<app-name>
```

### Issue 2: ConfigMap Key Not Found
**Symptom:** Pod fails to start with "key not found" error

**Diagnosis:**
```bash
kubectl describe configmap <app-name>-config
kubectl describe pod <pod-name>
```

**Fix:** Verify key exists in ConfigMap and matches deployment reference exactly (case-sensitive)

### Issue 3: Volume Mount Not Working
**Symptom:** Files not appearing in `/app/config/`

**Diagnosis:**
```bash
kubectl exec <pod-name> -- ls -la /app/config
kubectl describe pod <pod-name>
```

**Fix:** Check mountPath, volumeMounts, and ConfigMap name

---

## References

- Phase IV Constitution: `.specify/memory/phase-4-constitution.md` (Section VII, X)
- Skill: `.specify/skills/k8s-troubleshoot.skill.md`
- Example: `helm-charts/todo-app/templates/backend-deployment.yaml` (embedded ConfigMap pattern)

---

**Blueprint Version:** 1.0.0 | **Phase:** IV | **Last Updated:** 2026-01-03
