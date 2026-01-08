# Security Hardening

Production-grade security configurations for Helm charts.

## Pod Security Contexts

**Purpose**: Run containers with minimal privileges to reduce attack surface.

### Standard Pod Security Context

```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      securityContext:
        runAsNonRoot: true        # MUST NOT run as root
        runAsUser: 1000           # Non-root UID
        runAsGroup: 1000          # Non-root GID
        fsGroup: 1000             # File system group for volumes
        seccompProfile:           # Seccomp (restrict syscalls)
          type: RuntimeDefault
```

### Why Each Field Matters

| Field | Purpose | Risk if Omitted |
|-------|---------|-----------------|
| `runAsNonRoot: true` | Prevents root execution | Container can escalate to root |
| `runAsUser: 1000` | Explicit non-root UID | Uses container default (may be root) |
| `fsGroup: 1000` | Ownership for mounted volumes | Files may not be accessible |
| `seccompProfile` | Restricts system calls | Container can make dangerous syscalls |

---

## Container Security Contexts

**Purpose**: Per-container security restrictions (overrides pod-level settings).

### Standard Container Security Context

```yaml
containers:
- name: app
  securityContext:
    allowPrivilegeEscalation: false   # Cannot gain more privileges
    readOnlyRootFilesystem: true      # Root FS is read-only
    runAsNonRoot: true                # Double-check non-root
    capabilities:
      drop:
      - ALL                            # Drop all Linux capabilities
      add:
      - NET_BIND_SERVICE              # Only add specific capabilities if needed
```

### Capabilities Explained

**Default Capabilities** (automatically granted if not dropped):
- CHOWN, DAC_OVERRIDE, FOWNER, SETGID, SETUID, NET_RAW, etc.

**Best Practice**: Drop ALL capabilities, then add only what's needed:

| Capability | Purpose | When to Add |
|------------|---------|-------------|
| NET_BIND_SERVICE | Bind to ports < 1024 | If app must listen on port 80/443 |
| CHOWN | Change file ownership | If app needs chown inside container |
| DAC_OVERRIDE | Bypass file permissions | Almost never (dangerous) |
| SYS_TIME | Set system time | Almost never (dangerous) |

**Example**: Application that needs port 80:
```yaml
capabilities:
  drop:
  - ALL
  add:
  - NET_BIND_SERVICE
```

---

## Read-Only Root Filesystem

**Purpose**: Prevent container from writing to its own filesystem (reduces malware risk).

### Implementation

```yaml
securityContext:
  readOnlyRootFilesystem: true

volumeMounts:
- name: tmp
  mountPath: /tmp         # Writable temporary directory
- name: cache
  mountPath: /app/.cache  # Writable cache directory
- name: logs
  mountPath: /var/log     # Writable log directory

volumes:
- name: tmp
  emptyDir: {}
- name: cache
  emptyDir: {}
- name: logs
  emptyDir: {}
```

**Rationale**: Most applications need to write to `/tmp`, caches, or logs. Provide `emptyDir` volumes for these paths while keeping root FS read-only.

---

## Service Accounts and RBAC

**Purpose**: Grant minimal permissions needed for pods to interact with Kubernetes API.

### Create Minimal Service Account

```yaml
# templates/serviceaccount.yaml
{{- if .Values.serviceAccount.create -}}
apiVersion: v1
kind: ServiceAccount
metadata:
  name: {{ include "my-app.serviceAccountName" . }}
  namespace: {{ .Values.global.namespace }}
  labels:
    {{- include "my-app.labels" . | nindent 4 }}
  {{- with .Values.serviceAccount.annotations }}
  annotations:
    {{- toYaml . | nindent 4 }}
  {{- end }}
automountServiceAccountToken: {{ .Values.serviceAccount.automount }}
{{- end }}
```

### RBAC Role for Read-Only ConfigMap Access

```yaml
# templates/role.yaml
{{- if .Values.rbac.create -}}
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: {{ include "my-app.fullname" . }}
  namespace: {{ .Values.global.namespace }}
  labels:
    {{- include "my-app.labels" . | nindent 4 }}
rules:
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get", "list"]
  resourceNames:
  - {{ include "my-app.fullname" . }}-config
{{- end }}
```

### RBAC RoleBinding

```yaml
# templates/rolebinding.yaml
{{- if .Values.rbac.create -}}
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: {{ include "my-app.fullname" . }}
  namespace: {{ .Values.global.namespace }}
  labels:
    {{- include "my-app.labels" . | nindent 4 }}
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: {{ include "my-app.fullname" . }}
subjects:
- kind: ServiceAccount
  name: {{ include "my-app.serviceAccountName" . }}
  namespace: {{ .Values.global.namespace }}
{{- end }}
```

### values.yaml (Service Account)

```yaml
serviceAccount:
  create: true
  name: ""                         # Auto-generate name
  annotations: {}
  automount: false                 # Only true if app needs K8s API access

rbac:
  create: true                     # Create Role and RoleBinding
```

### When to Enable automountServiceAccountToken

| Scenario | Setting | Reason |
|----------|---------|--------|
| App doesn't use K8s API | `automount: false` | Reduce attack surface |
| App reads ConfigMaps dynamically | `automount: true` | Needs API token |
| App uses Kubernetes client library | `automount: true` | Needs API token |
| Sidecar (e.g., Istio) needs API | `automount: true` | Sidecar injection requires it |

---

## Network Policies

**Purpose**: Restrict pod-to-pod communication (zero-trust networking).

### Deny All Ingress Traffic (Default)

```yaml
# templates/networkpolicy-deny-all.yaml
{{- if .Values.networkPolicy.enabled -}}
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: {{ include "my-app.fullname" . }}-deny-all
  namespace: {{ .Values.global.namespace }}
  labels:
    {{- include "my-app.labels" . | nindent 4 }}
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
{{- end }}
```

### Allow Specific Ingress (Frontend → Backend)

```yaml
# templates/networkpolicy-backend.yaml
{{- if .Values.networkPolicy.enabled -}}
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: {{ include "my-app.fullname" . }}-backend
  namespace: {{ .Values.global.namespace }}
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/component: backend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  # Allow traffic from frontend pods
  - from:
    - podSelector:
        matchLabels:
          app.kubernetes.io/component: frontend-web
    - podSelector:
        matchLabels:
          app.kubernetes.io/component: frontend-chatbot
    ports:
    - protocol: TCP
      port: 8000
  # Allow traffic from ingress controller
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 8000
  egress:
  # Allow DNS
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - protocol: UDP
      port: 53
  # Allow external database (PostgreSQL)
  - to:
    - podSelector: {}
    ports:
    - protocol: TCP
      port: 5432
  # Allow external HTTPS
  - to:
    - podSelector: {}
    ports:
    - protocol: TCP
      port: 443
{{- end }}
```

### values.yaml (Network Policy)

```yaml
networkPolicy:
  enabled: true
  policyTypes:
    - Ingress
    - Egress
```

---

## Secret Management

**CRITICAL**: NEVER include actual secrets in Helm chart templates.

### Anti-Pattern (NEVER DO THIS)

```yaml
# ❌ BAD: Secrets in values.yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
stringData:
  database-url: {{ .Values.database.url }}  # ❌ Exposed in Git
  api-key: {{ .Values.apiKey }}             # ❌ Exposed in Helm history
```

### Best Practice: External Secret Management

#### Option 1: Manual Secret Creation (Before Helm Install)

```bash
# Create secret manually BEFORE installing chart
kubectl create secret generic app-secrets \
  --from-literal=database-url="postgresql://..." \
  --from-literal=api-key="sk-..." \
  --namespace=todo-app
```

Then reference in Deployment:
```yaml
env:
- name: DATABASE_URL
  valueFrom:
    secretKeyRef:
      name: app-secrets
      key: database-url
```

#### Option 2: External Secrets Operator

**Install External Secrets Operator**:
```bash
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets -n external-secrets-system --create-namespace
```

**Store secrets in AWS Secrets Manager / HashiCorp Vault / etc.**

**Create ExternalSecret**:
```yaml
# templates/externalsecret.yaml
{{- if .Values.externalSecrets.enabled -}}
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: {{ include "my-app.fullname" . }}-secrets
  namespace: {{ .Values.global.namespace }}
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secretsmanager
    kind: SecretStore
  target:
    name: app-secrets
    creationPolicy: Owner
  data:
  - secretKey: database-url
    remoteRef:
      key: /prod/todo-app/database-url
  - secretKey: api-key
    remoteRef:
      key: /prod/todo-app/openai-api-key
{{- end }}
```

#### Option 3: Sealed Secrets

**Encrypt secrets at rest in Git**:
```bash
# Install sealed-secrets controller
helm repo add sealed-secrets https://bitnami-labs.github.io/sealed-secrets
helm install sealed-secrets sealed-secrets/sealed-secrets -n kube-system

# Encrypt a secret
kubectl create secret generic app-secrets \
  --from-literal=database-url="postgresql://..." \
  --dry-run=client -o yaml | \
  kubeseal -o yaml > templates/sealed-secret.yaml
```

---

## Image Security

### Use Official Base Images

```yaml
# values.yaml
backend:
  image:
    repository: myorg/backend
    tag: "1.0.0"
    pullPolicy: Always
```

**Base Image Guidelines**:
- Prefer `alpine` variants (smaller attack surface)
- Use specific tags (never `latest` in production)
- Scan images with Trivy/Snyk before deployment

### Image Pull Policy

| Environment | Pull Policy | Rationale |
|-------------|-------------|-----------|
| Production | `Always` | Get latest security patches |
| Development | `IfNotPresent` | Use local images for faster iteration |

### Image Pull Secrets (Private Registries)

```yaml
# values.yaml
imagePullSecrets:
- name: regcred

# Create secret manually
kubectl create secret docker-registry regcred \
  --docker-server=myregistry.com \
  --docker-username=user \
  --docker-password=pass \
  --namespace=todo-app
```

```yaml
# Deployment template
spec:
  template:
    spec:
      imagePullSecrets:
        {{- toYaml .Values.imagePullSecrets | nindent 8 }}
```

---

## Resource Limits and Requests

**Purpose**: Prevent resource exhaustion attacks (DoS).

### Enforce Limits on All Containers

```yaml
resources:
  requests:
    memory: "256Mi"   # Minimum memory guaranteed
    cpu: "250m"       # Minimum CPU guaranteed (0.25 cores)
  limits:
    memory: "512Mi"   # Maximum memory (killed if exceeded)
    cpu: "500m"       # Maximum CPU (throttled if exceeded)
```

### LimitRange (Namespace-Level Defaults)

```yaml
# templates/limitrange.yaml
{{- if .Values.limitRange.enabled -}}
apiVersion: v1
kind: LimitRange
metadata:
  name: {{ include "my-app.fullname" . }}-limits
  namespace: {{ .Values.global.namespace }}
spec:
  limits:
  - max:
      memory: "2Gi"
      cpu: "2000m"
    min:
      memory: "64Mi"
      cpu: "50m"
    default:
      memory: "256Mi"
      cpu: "250m"
    defaultRequest:
      memory: "128Mi"
      cpu: "100m"
    type: Container
{{- end }}
```

---

## Pod Disruption Budgets

**Purpose**: Ensure availability during voluntary disruptions (e.g., node drains, cluster upgrades).

```yaml
# templates/poddisruptionbudget.yaml
{{- if .Values.podDisruptionBudget.enabled -}}
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: {{ include "my-app.fullname" . }}-backend
  namespace: {{ .Values.global.namespace }}
  labels:
    {{- include "my-app.labels" . | nindent 4 }}
spec:
  minAvailable: {{ .Values.podDisruptionBudget.minAvailable }}
  selector:
    matchLabels:
      {{- include "my-app.selectorLabels" . | nindent 6 }}
      app.kubernetes.io/component: backend
{{- end }}
```

### values.yaml (PDB)

```yaml
podDisruptionBudget:
  enabled: true
  minAvailable: 1  # At least 1 pod must remain available during disruptions
```

---

## Security Checklist

Before deploying to production, verify:

### Pod Security
- [ ] `runAsNonRoot: true` set on all pods
- [ ] `runAsUser` and `fsGroup` set to non-root UID (e.g., 1000)
- [ ] `allowPrivilegeEscalation: false` on all containers
- [ ] `readOnlyRootFilesystem: true` on all containers (with writable volumes for /tmp)
- [ ] `capabilities: drop: [ALL]` on all containers
- [ ] `seccompProfile: RuntimeDefault` set

### RBAC
- [ ] Service account created for each workload
- [ ] `automountServiceAccountToken: false` unless app needs K8s API
- [ ] Role grants minimal permissions (e.g., read-only ConfigMaps)
- [ ] No ClusterRole unless cross-namespace access needed

### Network Security
- [ ] Network policies defined (deny-all + allow-specific)
- [ ] Ingress restricted to required pods only
- [ ] Egress restricted to DNS + required services

### Secrets
- [ ] NO secrets in values.yaml or Git
- [ ] Secrets created manually or via external secret manager
- [ ] `secretKeyRef` used in env variables
- [ ] Secret names documented in README

### Resource Management
- [ ] Resource requests and limits set on all containers
- [ ] LimitRange enforced at namespace level
- [ ] PodDisruptionBudget configured for high-availability workloads

### Images
- [ ] Official base images used (e.g., `python:3.11-alpine`)
- [ ] Specific image tags (never `latest` in prod)
- [ ] Images scanned for vulnerabilities (Trivy, Snyk)
- [ ] `pullPolicy: Always` in production

### Audit Logging
- [ ] Audit logs enabled at cluster level
- [ ] Sensitive actions logged (secret access, RBAC changes)
- [ ] Logs shipped to centralized logging (ELK, Loki)

---

## Common Security Mistakes

### ❌ Running as Root

```yaml
# BAD
spec:
  containers:
  - name: app
    image: myapp:latest
    # No securityContext → defaults to root
```

### ✅ Running as Non-Root

```yaml
# GOOD
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
  containers:
  - name: app
    securityContext:
      allowPrivilegeEscalation: false
```

---

### ❌ Writable Root Filesystem

```yaml
# BAD
containers:
- name: app
  image: myapp:latest
  # No readOnlyRootFilesystem → malware can write to FS
```

### ✅ Read-Only with Writable Volumes

```yaml
# GOOD
containers:
- name: app
  securityContext:
    readOnlyRootFilesystem: true
  volumeMounts:
  - name: tmp
    mountPath: /tmp
volumes:
- name: tmp
  emptyDir: {}
```

---

### ❌ Secrets in Values

```yaml
# BAD (values.yaml)
database:
  url: "postgresql://user:password@host/db"  # ❌ Exposed in Git
```

### ✅ Secrets via SecretKeyRef

```yaml
# GOOD (deployment.yaml)
env:
- name: DATABASE_URL
  valueFrom:
    secretKeyRef:
      name: app-secrets
      key: database-url
```

---

### ❌ No Network Policies

```yaml
# BAD: All pods can talk to all pods
# No NetworkPolicy resources defined
```

### ✅ Deny-All + Allow-Specific

```yaml
# GOOD
# 1. Deny all traffic
# 2. Allow only frontend → backend on port 8000
```

---

## Additional Resources

- **Kubernetes Security Best Practices**: https://kubernetes.io/docs/concepts/security/
- **CIS Kubernetes Benchmark**: https://www.cisecurity.org/benchmark/kubernetes
- **NSA/CISA Kubernetes Hardening Guide**: https://media.defense.gov/2022/Aug/29/2003066362/-1/-1/0/CTR_KUBERNETES_HARDENING_GUIDANCE_1.2_20220829.PDF
- **Pod Security Standards**: https://kubernetes.io/docs/concepts/security/pod-security-standards/
