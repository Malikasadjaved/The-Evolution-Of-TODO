# Helm 3 Best Practices

Domain expertise for Helm 3.x chart development.

## Helm 3 vs Helm 2 Key Differences

| Feature | Helm 2 | Helm 3 |
|---------|--------|--------|
| Architecture | Client-server (Tiller) | Client-only |
| Security | Tiller has cluster admin | User's kubectl permissions |
| Release storage | ConfigMaps in kube-system | Secrets in release namespace |
| Namespace | Optional (default) | Required |
| CRD handling | Before install | With install |
| Chart repo | Stable/incubator defaults | No default repos |

**Use Helm 3 for all new charts** - Tiller is deprecated and insecure.

## Chart Versioning

Follow Semantic Versioning 2.0.0:

```yaml
version: 1.2.3       # Chart version (bumped when chart changes)
appVersion: "2.1.0"  # Application version (bumped when app changes)
```

### When to Bump

| Change | Chart Version | App Version |
|--------|---------------|-------------|
| Fix template bug | Patch (1.0.1) | No change |
| Add new optional feature | Minor (1.1.0) | No change |
| Breaking change to values.yaml | Major (2.0.0) | No change |
| Update application image | No change | Bump app version |
| Both chart and app changes | Bump chart | Bump app |

## Values Files Hierarchy

Helm merges values in this order (last wins):

1. values.yaml (base defaults)
2. values-{env}.yaml (via -f flag)
3. --set flags (highest priority)

**Pattern:**
```
values.yaml         → Production defaults (conservative)
values-dev.yaml     → Development overrides (permissive)
values-staging.yaml → Staging overrides
values-prod.yaml    → Production overrides (if different from base)
```

## Required vs Optional Values

### Required Values (No Defaults)

For values that MUST be set by user:

```yaml
# values.yaml
database:
  host: ""  # Required: No default

# deployment.yaml
{{- if not .Values.database.host }}
{{- fail "database.host is required" }}
{{- end }}
```

### Optional Values (With Defaults)

```yaml
# values.yaml
replicaCount: 2  # Default: 2 replicas
```

## Image Pull Policies

```yaml
# Production (values.yaml)
image:
  pullPolicy: Always  # Always pull to get latest security patches

# Development (values-dev.yaml)
image:
  pullPolicy: IfNotPresent  # Use local images for faster iteration
```

## Resource Management

**Always set resource requests and limits:**

```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"     # 0.25 cores
  limits:
    memory: "512Mi"
    cpu: "500m"     # 0.5 cores
```

**Sizing Guidelines:**

| Service Type | Memory Request | Memory Limit | CPU Request | CPU Limit |
|--------------|----------------|--------------|-------------|-----------|
| Small API | 128Mi | 256Mi | 100m | 200m |
| Medium API | 256Mi | 512Mi | 250m | 500m |
| Large API | 512Mi | 1Gi | 500m | 1000m |
| Frontend (Node.js) | 128Mi | 256Mi | 100m | 200m |
| Worker | 256Mi | 512Mi | 250m | 500m |
| Database | 1Gi | 2Gi | 1000m | 2000m |

## Health Probes Best Practices

### Liveness Probe
Tests if container is alive. Restart if fails.

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 10   # Wait for app to start
  periodSeconds: 30         # Check every 30s
  timeoutSeconds: 5         # Fail if no response in 5s
  failureThreshold: 3       # Restart after 3 failures
```

### Readiness Probe
Tests if container can serve traffic. Remove from load balancer if fails.

```yaml
readinessProbe:
  httpGet:
    path: /ready
    port: 8000
  initialDelaySeconds: 5    # Faster than liveness
  periodSeconds: 10         # Check more frequently
  timeoutSeconds: 3
  failureThreshold: 3
```

### Startup Probe (For Slow-Starting Apps)

```yaml
startupProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 0
  periodSeconds: 10
  failureThreshold: 30      # Allow up to 5 minutes (30 x 10s)
```

**Order:** Startup → Liveness + Readiness

## Template Functions

### Required Values

```yaml
{{ required "A valid database URL is required" .Values.database.url }}
```

### Default Values

```yaml
{{ .Values.replicaCount | default 2 }}
```

### String Formatting

```yaml
{{ printf "%s-%s" .Release.Name .Chart.Name }}
```

### YAML Indentation

```yaml
resources:
  {{- toYaml .Values.resources | nindent 12 }}
```

### Conditionals

```yaml
{{- if .Values.ingress.enabled }}
# Ingress template
{{- end }}
```

### Loops

```yaml
{{- range .Values.services }}
- name: {{ .name }}
  port: {{ .port }}
{{- end }}
```

## Dependency Management

### Chart Dependencies (Chart.yaml)

```yaml
dependencies:
- name: postgresql
  version: "12.1.0"
  repository: "https://charts.bitnami.com/bitnami"
  condition: postgresql.enabled
```

### Update Dependencies

```bash
helm dependency update <chart-name>
```

Creates `charts/` directory with dependency charts.

## Hooks

Run Jobs at specific points in release lifecycle:

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-weight": "-5"
    "helm.sh/hook-delete-policy": before-hook-creation
spec:
  template:
    spec:
      containers:
      - name: db-migration
        image: myapp:latest
        command: ["./migrate.sh"]
      restartPolicy: Never
```

**Hook Types:**
- `pre-install`, `post-install`
- `pre-delete`, `post-delete`
- `pre-upgrade`, `post-upgrade`
- `pre-rollback`, `post-rollback`
- `test` (for `helm test`)

## Tests

Create test pods to validate deployment:

```yaml
# templates/tests/test-connection.yaml
apiVersion: v1
kind: Pod
metadata:
  annotations:
    "helm.sh/hook": test
spec:
  containers:
  - name: wget
    image: busybox
    command: ['wget']
    args: ['{{ include "mychart.fullname" . }}:{{ .Values.service.port }}']
  restartPolicy: Never
```

Run tests:
```bash
helm test <release-name>
```

## Chart Naming Conventions

| Resource | Naming Pattern | Example |
|----------|----------------|---------|
| Chart directory | lowercase-hyphen | `my-app` |
| Template files | lowercase-hyphen.yaml | `backend-deployment.yaml` |
| Kubernetes resources | `{{ include "chart.fullname" . }}-<service>` | `my-app-backend` |
| Labels | app.kubernetes.io/* | `app.kubernetes.io/name: my-app` |
| Helpers | `<chart>.<helper>` | `my-app.labels` |

## Common Mistakes to Avoid

### ❌ Hardcoding Values

```yaml
# BAD
image: my-app:latest

# GOOD
image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
```

### ❌ Missing Indentation Helpers

```yaml
# BAD
env:
{{ toYaml .Values.env }}

# GOOD
env:
  {{- toYaml .Values.env | nindent 2 }}
```

### ❌ Not Using Helpers

```yaml
# BAD (repeated in every template)
labels:
  app: my-app
  version: v1

# GOOD (defined once in _helpers.tpl)
labels:
  {{- include "my-app.labels" . | nindent 4 }}
```

### ❌ Including Secrets in Chart

```yaml
# NEVER DO THIS
apiVersion: v1
kind: Secret
data:
  password: {{ .Values.password | b64enc }}  # ❌ Secrets in values.yaml!

# DO THIS INSTEAD
# Create secret.yaml.example with instructions
# Users create secrets manually or via external secret manager
```

## Chart Documentation

### README.md Required Sections

```markdown
# Chart Name

## Prerequisites
- Kubernetes 1.19+
- Helm 3.x

## Installing the Chart
\`\`\`bash
helm install my-release ./my-chart
\`\`\`

## Configuration
| Parameter | Description | Default |
|-----------|-------------|---------|
| replicaCount | Number of replicas | 2 |

## Uninstalling
\`\`\`bash
helm uninstall my-release
\`\`\`
```

## Production Readiness Checklist

- [ ] Chart.yaml with semantic version
- [ ] values.yaml with production defaults
- [ ] Environment-specific values files
- [ ] Resource limits on all containers
- [ ] Health probes on all pods
- [ ] Security contexts configured
- [ ] RBAC templates (if needed)
- [ ] _helpers.tpl with common labels
- [ ] NOTES.txt with post-install instructions
- [ ] README.md with usage guide
- [ ] Tests in templates/tests/
- [ ] Helm lint passes
- [ ] No secrets in templates
