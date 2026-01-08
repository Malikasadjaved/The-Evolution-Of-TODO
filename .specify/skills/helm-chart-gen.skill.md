# Skill: Helm Chart Generator

**Purpose:** Generate production-ready Helm charts following Phase IV constitution Kubernetes-native design and standardization requirements.

**When to Use:**
- Packaging Kubernetes applications for deployment
- Creating reusable deployment templates
- Implementing GitOps workflows
- Enabling multi-environment deployments (dev, staging, prod)

**Phase IV Constitution Reference:** Section IV (Helm Chart Standardization)

---

## Inputs

1. **Application Name:** e.g., "todo-app", "api-service"
2. **Services:** List of microservices to deploy (backend, frontend, worker, etc.)
3. **Environment Types:** Development (Minikube), Staging, Production
4. **Resource Requirements:** CPU/memory requests and limits per service
5. **Configuration:** Environment variables, secrets, ConfigMaps

---

## Helm Chart Structure

```
helm-charts/
└── <app-name>/
    ├── Chart.yaml                  # Chart metadata
    ├── values.yaml                 # Default (production) values
    ├── values-dev.yaml             # Development overrides
    ├── values-staging.yaml         # Staging overrides (optional)
    ├── templates/
    │   ├── _helpers.tpl            # Template helper functions
    │   ├── <service>-deployment.yaml
    │   ├── <service>-service.yaml
    │   ├── configmap.yaml          # Non-secret configuration
    │   ├── secret.yaml             # Secret template (never populated)
    │   ├── ingress.yaml            # Optional: domain-based routing
    │   ├── hpa.yaml                # Optional: auto-scaling
    │   └── NOTES.txt               # Post-install instructions
    └── .helmignore                 # Files to exclude from chart
```

---

## Pattern: Chart.yaml (Metadata)

```yaml
apiVersion: v2
name: todo-app
description: Kubernetes deployment for Todo Application (Phase IV)
type: application
version: 1.0.0
appVersion: "phase-4"
keywords:
  - todo
  - task-management
  - fastapi
  - nextjs
maintainers:
  - name: Todo App Team
    email: team@todo-app.com
sources:
  - https://github.com/your-org/todo-app
```

---

## Pattern: values.yaml (Production Defaults)

```yaml
# Global configuration (shared across all services)
global:
  environment: production
  imageRegistry: ""  # Empty for default registry

# Backend service configuration
backend:
  image:
    repository: todo-backend
    tag: latest
    pullPolicy: Always  # Production: always pull

  replicaCount: 2

  resources:
    requests:
      memory: "256Mi"
      cpu: "250m"
    limits:
      memory: "512Mi"
      cpu: "500m"

  service:
    type: ClusterIP  # Internal only
    port: 8000

  # Environment variables (non-secret)
  env:
    FRONTEND_URL: "https://todo.example.com"
    LOG_LEVEL: "WARN"
    ENVIRONMENT: "production"

# Frontend service configuration
frontend:
  image:
    repository: todo-frontend
    tag: latest
    pullPolicy: Always

  replicaCount: 2

  resources:
    requests:
      memory: "128Mi"
      cpu: "100m"
    limits:
      memory: "256Mi"
      cpu: "200m"

  service:
    type: LoadBalancer  # Cloud: external access
    port: 3000

  env:
    NEXT_PUBLIC_API_URL: "https://api.todo.example.com"

# Secrets (never populate in values.yaml)
secrets:
  name: app-secrets  # Kubernetes Secret resource name

# Autoscaling (optional)
autoscaling:
  enabled: false
  backend:
    minReplicas: 2
    maxReplicas: 5
    targetCPUUtilizationPercentage: 70

# Ingress (optional)
ingress:
  enabled: false
  className: nginx
```

---

## Pattern: values-dev.yaml (Minikube Overrides)

```yaml
global:
  environment: development

backend:
  image:
    pullPolicy: IfNotPresent  # Use Minikube Docker daemon

  env:
    FRONTEND_URL: "http://localhost:3000"
    LOG_LEVEL: "INFO"  # More verbose

frontend:
  image:
    pullPolicy: IfNotPresent

  service:
    type: NodePort  # Minikube: external access
    nodePort: 30000

  env:
    NEXT_PUBLIC_API_URL: "http://backend-service:8000"  # Internal DNS

autoscaling:
  enabled: false

ingress:
  enabled: false
```

---

## Pattern: _helpers.tpl (Template Functions)

```go
{{/*
Expand the name of the chart.
*/}}
{{- define "todo-app.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "todo-app.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "todo-app.labels" -}}
helm.sh/chart: {{ include "todo-app.chart" . }}
{{ include "todo-app.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "todo-app.selectorLabels" -}}
app.kubernetes.io/name: {{ include "todo-app.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Backend labels
*/}}
{{- define "todo-app.backend.labels" -}}
{{ include "todo-app.labels" . }}
app: backend
tier: api
{{- end }}
```

---

## Pattern: Deployment Template

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "todo-app.fullname" . }}-backend
  labels:
    {{- include "todo-app.backend.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.backend.replicaCount }}
  selector:
    matchLabels:
      {{- include "todo-app.backend.selectorLabels" . | nindent 6 }}
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0  # Zero downtime
      maxSurge: 1
  template:
    metadata:
      labels:
        {{- include "todo-app.backend.selectorLabels" . | nindent 8 }}
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
      containers:
      - name: backend
        image: "{{ .Values.backend.image.repository }}:{{ .Values.backend.image.tag }}"
        imagePullPolicy: {{ .Values.backend.image.pullPolicy }}
        ports:
        - containerPort: {{ .Values.backend.service.port }}
          protocol: TCP
          name: http
        env:
        # Environment variables from values
        - name: FRONTEND_URL
          value: {{ .Values.backend.env.FRONTEND_URL | quote }}
        - name: LOG_LEVEL
          value: {{ .Values.backend.env.LOG_LEVEL | quote }}
        # Secrets from Kubernetes Secret
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: {{ .Values.secrets.name }}
              key: DATABASE_URL
        resources:
          {{- toYaml .Values.backend.resources | nindent 10 }}
        livenessProbe:
          httpGet:
            path: /health
            port: {{ .Values.backend.service.port }}
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /ready
            port: {{ .Values.backend.service.port }}
          initialDelaySeconds: 5
          periodSeconds: 10
```

---

## Pattern: Service Template

```yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ include "todo-app.fullname" . }}-backend
  labels:
    {{- include "todo-app.backend.labels" . | nindent 4 }}
spec:
  type: {{ .Values.backend.service.type }}
  selector:
    {{- include "todo-app.backend.selectorLabels" . | nindent 4 }}
  ports:
  - name: http
    protocol: TCP
    port: {{ .Values.backend.service.port }}
    targetPort: {{ .Values.backend.service.port }}
    {{- if eq .Values.backend.service.type "NodePort" }}
    nodePort: {{ .Values.backend.service.nodePort }}
    {{- end }}
```

---

## Pattern: NOTES.txt (Post-Install Instructions)

```text
🎉 {{ .Chart.Name }} deployed successfully!

📊 Release Information:
   Name: {{ .Release.Name }}
   Namespace: {{ .Release.Namespace }}
   Version: {{ .Chart.Version }}
   Environment: {{ .Values.global.environment }}

📝 Next Steps:

1. Check deployment status:
   kubectl get pods -l app.kubernetes.io/instance={{ .Release.Name }}

2. Wait for all pods to be Running:
   kubectl wait --for=condition=Ready pods -l app.kubernetes.io/instance={{ .Release.Name }} --timeout=5m

3. Access the services:
{{- if eq .Values.frontend.service.type "NodePort" }}
   Frontend: minikube service {{ include "todo-app.fullname" . }}-frontend --url
{{- else if eq .Values.frontend.service.type "LoadBalancer" }}
   Frontend: kubectl get svc {{ include "todo-app.fullname" . }}-frontend
{{- end }}

⚠️  Important:
   - Ensure Kubernetes Secret '{{ .Values.secrets.name }}' exists
   - Use 'helm upgrade {{ .Release.Name }}' to update
   - Use 'helm rollback {{ .Release.Name }}' to revert
```

---

## Helm Commands

```bash
# Lint chart (validate syntax)
helm lint ./helm-charts/todo-app

# Dry-run (preview what will be created)
helm install --dry-run --debug todo-app ./helm-charts/todo-app -f ./helm-charts/todo-app/values-dev.yaml

# Install chart
helm install todo-app ./helm-charts/todo-app -f ./helm-charts/todo-app/values-dev.yaml

# Upgrade (apply changes)
helm upgrade todo-app ./helm-charts/todo-app -f ./helm-charts/todo-app/values-dev.yaml

# Rollback to previous version
helm rollback todo-app

# Rollback to specific revision
helm rollback todo-app 2

# View release history
helm history todo-app

# Uninstall chart
helm uninstall todo-app

# List installed charts
helm list

# Get values for release
helm get values todo-app
```

---

## Validation Checklist

- [ ] Chart.yaml has valid metadata (name, version, appVersion)
- [ ] values.yaml defines all configurable parameters
- [ ] values-dev.yaml overrides for local development
- [ ] _helpers.tpl defines reusable template functions
- [ ] All templates use helper functions (no hardcoded names)
- [ ] Resources have requests and limits defined
- [ ] Health probes (liveness + readiness) configured
- [ ] Security context (non-root user) specified
- [ ] Secrets referenced (never populated in values)
- [ ] NOTES.txt provides post-install instructions
- [ ] helm lint passes without warnings
- [ ] helm install --dry-run passes

---

## Common Pitfalls to Avoid

❌ **DON'T:**
- Hardcode release names (use `{{ .Release.Name }}`)
- Put actual secrets in values.yaml (security risk)
- Forget to define resource limits (causes instability)
- Use `:latest` tag in production (use specific versions)
- Skip health probes (monitoring blind spot)

✅ **DO:**
- Use helper functions for labels and names
- Reference secrets from external Kubernetes Secret
- Define resource requests and limits
- Use semantic versioning for chart versions
- Include comprehensive NOTES.txt
- Test with helm lint and dry-run

---

## References

- Phase IV Constitution: `.specify/memory/phase-4-constitution.md` (Section IV)
- Data Model: `specs/003-k8s-deployment/data-model.md`
- Example Helm Chart: `helm-charts/todo-app/`

---

**Skill Version:** 1.0.0 | **Phase:** IV | **Last Updated:** 2026-01-03
