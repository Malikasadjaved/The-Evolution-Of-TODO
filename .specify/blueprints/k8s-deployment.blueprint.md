# Blueprint: Kubernetes Deployment

**Purpose:** Standard pattern for creating production-ready Kubernetes Deployments with best practices from Phase IV constitution.

**When to Use:**
- Deploying containerized applications to Kubernetes
- Ensuring high availability with multiple replicas
- Implementing zero-downtime rolling updates
- Enforcing resource limits and security policies

**Phase IV Constitution Reference:** Section III (Kubernetes-Native Design)

---

## Standard Deployment Pattern

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: <app-name>-<service-name>
  labels:
    app: <service-name>
    tier: <api|web|worker>
    phase: <phase-number>
    version: <semantic-version>
spec:
  replicas: 2  # Minimum for HA

  selector:
    matchLabels:
      app: <service-name>

  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0  # Zero downtime (CRITICAL)
      maxSurge: 1

  template:
    metadata:
      labels:
        app: <service-name>
        tier: <api|web|worker>
        version: <semantic-version>

    spec:
      # Security Context (REQUIRED - Constitution Section X)
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000  # Non-root user
        fsGroup: 1000

      containers:
      - name: <service-name>
        image: <registry>/<image-name>:<tag>
        imagePullPolicy: IfNotPresent  # Dev: IfNotPresent, Prod: Always

        ports:
        - containerPort: <port>
          protocol: TCP
          name: http

        # Environment Variables (REQUIRED)
        env:
        # Non-secret config (from values or ConfigMap)
        - name: ENVIRONMENT
          value: <dev|staging|production>
        - name: LOG_LEVEL
          value: <INFO|WARN|ERROR>

        # Secrets (from Kubernetes Secret)
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: DATABASE_URL
        - name: API_KEY
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: API_KEY

        # Resource Limits (REQUIRED - Constitution Section IX)
        resources:
          requests:
            memory: "256Mi"  # Guaranteed minimum
            cpu: "250m"
          limits:
            memory: "512Mi"  # Maximum allowed
            cpu: "500m"

        # Liveness Probe (REQUIRED - Constitution Section VIII)
        livenessProbe:
          httpGet:
            path: /health
            port: <port>
          initialDelaySeconds: 10
          periodSeconds: 30
          timeoutSeconds: 3
          failureThreshold: 3

        # Readiness Probe (REQUIRED - Constitution Section VIII)
        readinessProbe:
          httpGet:
            path: /ready
            port: <port>
          initialDelaySeconds: 5
          periodSeconds: 10
          timeoutSeconds: 3
          failureThreshold: 3
```

---

## Field Reference

### Metadata
- **name**: Format: `<app-name>-<service-name>` (e.g., `todo-app-backend`)
- **labels**: Key-value pairs for organization and selection
  - `app`: Service identifier (e.g., `backend`, `frontend-web`)
  - `tier`: Service tier (`api`, `web`, `worker`, `database`)
  - `phase`: Development phase (e.g., `phase-4`)
  - `version`: Semantic version (e.g., `1.0.0`)

### Replicas
- **Development (Minikube)**: 1-2 replicas
- **Staging**: 2 replicas
- **Production**: 2+ replicas (adjust based on load)

### Strategy
- **type**: `RollingUpdate` (REQUIRED for zero downtime)
- **maxUnavailable**: `0` (ensures at least one pod always running)
- **maxSurge**: `1` (allows one extra pod during update)

### Security Context
- **runAsNonRoot**: `true` (REQUIRED - Constitution Section X)
- **runAsUser**: `1000` or `1001` (non-root UID)
- **fsGroup**: Same as runAsUser (for file system access)

### Image Pull Policy
- **Development**: `IfNotPresent` (use local Minikube images)
- **Production**: `Always` (pull latest from registry)

### Environment Variables
- **Non-Secrets**: Define directly or via ConfigMap
- **Secrets**: Reference via `secretKeyRef` (NEVER hardcode)

### Resource Limits (Constitution Section IX)
- **Requests**: Guaranteed minimum resources
  - Backend API: 256Mi memory, 250m CPU
  - Frontend Web: 128Mi memory, 100m CPU
  - Worker: 512Mi memory, 500m CPU
- **Limits**: Maximum allowed (prevents runaway processes)
  - Backend API: 512Mi memory, 500m CPU
  - Frontend Web: 256Mi memory, 200m CPU
  - Worker: 1Gi memory, 1000m CPU

### Health Probes (Constitution Section VIII)
- **Liveness Probe**: Restarts container if fails (detect deadlocks)
  - Path: `/health` (simple status check)
  - initialDelaySeconds: 10-30s (allow startup time)
  - periodSeconds: 30s (check every 30s)
- **Readiness Probe**: Removes from service if fails (detect dependencies)
  - Path: `/ready` (check database, APIs)
  - initialDelaySeconds: 5-10s (faster than liveness)
  - periodSeconds: 10s (check every 10s)

---

## Validation Checklist

Before applying deployment:

- [ ] Image exists in registry/Minikube Docker daemon
- [ ] Non-root user specified (UID 1000 or 1001)
- [ ] Resource requests and limits defined
- [ ] Liveness probe checks `/health` endpoint
- [ ] Readiness probe checks `/ready` endpoint
- [ ] Secrets referenced (not hardcoded)
- [ ] Environment variables documented
- [ ] RollingUpdate strategy with maxUnavailable: 0
- [ ] Replicas >= 2 for production
- [ ] Labels follow convention (app, tier, phase, version)

---

## Common Modifications

### Increase Replicas (Horizontal Scaling)
```yaml
spec:
  replicas: 5  # Scale up for higher load
```

### Add Init Container (Database Migration)
```yaml
spec:
  template:
    spec:
      initContainers:
      - name: db-migration
        image: <migration-image>
        command: ['python', 'migrate.py']
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: DATABASE_URL
```

### Add Volume Mount (Persistent Data)
```yaml
spec:
  template:
    spec:
      containers:
      - name: <service-name>
        volumeMounts:
        - name: data
          mountPath: /data
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: <pvc-name>
```

### Add Affinity (Pod Scheduling)
```yaml
spec:
  template:
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - backend
              topologyKey: kubernetes.io/hostname
```

---

## Troubleshooting

### Pods Not Starting
```bash
kubectl describe deployment <app-name>-<service-name>
kubectl get events --sort-by='.lastTimestamp'
```

### Resource Issues
```bash
kubectl top nodes
kubectl top pods
kubectl describe nodes | grep -A 5 "Allocated resources"
```

### Rollback
```bash
kubectl rollout undo deployment/<app-name>-<service-name>
kubectl rollout status deployment/<app-name>-<service-name>
```

---

## References

- Phase IV Constitution: `.specify/memory/phase-4-constitution.md` (Section III)
- Skill: `.specify/skills/k8s-troubleshoot.skill.md`
- Example: `k8s/backend-deployment.yaml`

---

**Blueprint Version:** 1.0.0 | **Phase:** IV | **Last Updated:** 2026-01-03
