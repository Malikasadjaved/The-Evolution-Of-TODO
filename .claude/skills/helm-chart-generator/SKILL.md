---
name: helm-chart-generator
description: |
  Generates production-ready Helm 3.x charts for multi-service Kubernetes applications with security hardening, health probes, resource limits, and multi-environment support.
  This skill should be used when users need to create Helm charts for deploying stateless services, stateful services, or applications with ingress routing. Supports best practices for microservices deployments.
allowed-tools: Read, Write, Glob, Grep, Bash
---

# Helm Chart Generator

Generate production-ready Helm 3.x charts for multi-service Kubernetes applications.

## What This Skill Does

- Generates complete Helm chart structure (Chart.yaml, values.yaml, templates/)
- Creates deployments for stateless services, StatefulSets for stateful services
- Configures Services, ConfigMaps, Secrets templates
- Includes Ingress resources for HTTP/HTTPS routing
- Applies security hardening (non-root users, read-only FS, security contexts)
- Sets up health probes (liveness, readiness, startup)
- Enforces resource limits (CPU, memory)
- Generates environment-specific values files (dev, staging, prod)
- Creates helper templates (_helpers.tpl) for labels and selectors
- Includes post-install NOTES.txt

## What This Skill Does NOT Do

- Deploy charts (use `helm install` manually)
- Manage Helm releases or rollbacks
- Create Operators or CRDs
- Generate Charts for Helm 2.x (Tiller-based)

---

## Before Implementation

Gather context to ensure successful chart generation:

| Source | Gather |
|--------|--------|
| **Codebase** | Existing services, Dockerfiles, environment variables, ports |
| **Conversation** | Service types, dependencies, persistence needs, ingress requirements |
| **Skill References** | Helm best practices from `references/` |
| **User Guidelines** | Naming conventions, label standards, organization preferences |

Ensure all required context is gathered before generating chart files.

---

## Chart Generation Workflow

### Step 1: Discover Services

Ask user for service inventory:

**Required for each service:**
- Service name (e.g., `backend`, `frontend-web`)
- Service type: `stateless`, `stateful`, or `job`
- Container image name and tag
- Exposed port(s)
- Environment variables (non-secret)
- Secrets needed (reference names only)

**Required for ingress (if needed):**
- Domain/hostname
- Path routing rules
- TLS certificate (yes/no)

### Step 2: Initialize Chart Structure

Create Helm chart directory:

```bash
helm create <chart-name>
```

Then reorganize to standard structure:

```
<chart-name>/
├── Chart.yaml
├── values.yaml
├── values-dev.yaml
├── values-staging.yaml
├── values-prod.yaml
├── templates/
│   ├── _helpers.tpl
│   ├── NOTES.txt
│   ├── <service>-deployment.yaml    (or statefulset.yaml)
│   ├── <service>-service.yaml
│   ├── <service>-configmap.yaml
│   ├── secret.yaml.example
│   └── ingress.yaml (if needed)
└── README.md
```

### Step 3: Generate Chart.yaml

See `references/chart-structure.md` for complete specification.

**Minimum required fields:**
```yaml
apiVersion: v2
name: <chart-name>
description: <brief description>
type: application
version: 1.0.0        # Chart version
appVersion: "1.0.0"   # Application version
```

### Step 4: Generate values.yaml

Follow pattern from `references/multi-service-patterns.md`.

**Structure:**
```yaml
global:
  environment: production

<service-name>:
  enabled: true
  replicaCount: 2
  image:
    repository: <image>
    tag: latest
    pullPolicy: IfNotPresent
  service:
    type: ClusterIP
    port: <port>
  resources:
    requests:
      memory: "256Mi"
      cpu: "250m"
    limits:
      memory: "512Mi"
      cpu: "500m"
  # More service-specific values...
```

Apply values from `references/helm-3-best-practices.md`:
- Set resource limits for all containers
- Configure health probes
- Use semantic versioning
- Include security contexts

### Step 5: Generate Environment-Specific Values

Create values-{env}.yaml for each environment:

**values-dev.yaml**: Local/Minikube overrides
```yaml
global:
  environment: development

<service-name>:
  replicaCount: 1
  image:
    pullPolicy: IfNotPresent  # Use local images
  resources:
    requests:
      memory: "128Mi"
      cpu: "100m"
```

**values-prod.yaml**: Production overrides
```yaml
global:
  environment: production

<service-name>:
  replicaCount: 3
  image:
    pullPolicy: Always
  resources:
    requests:
      memory: "512Mi"
      cpu: "500m"
    limits:
      memory: "1Gi"
      cpu: "1000m"
```

### Step 6: Generate Deployment Templates

For **stateless services**, use Deployment:

See `references/multi-service-patterns.md#stateless-deployment` for complete template.

**Key sections:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "<chart>.fullname" . }}-<service>
  labels:
    {{- include "<chart>.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.<service>.replicaCount }}
  selector:
    matchLabels:
      app: <service>
  template:
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
      containers:
      - name: <service>
        image: "{{ .Values.<service>.image.repository }}:{{ .Values.<service>.image.tag }}"
        ports:
        - containerPort: {{ .Values.<service>.service.port }}
        livenessProbe:
          httpGet:
            path: /health
            port: {{ .Values.<service>.service.port }}
        readinessProbe:
          httpGet:
            path: /ready
            port: {{ .Values.<service>.service.port }}
        resources:
          {{- toYaml .Values.<service>.resources | nindent 12 }}
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
```

For **stateful services**, use StatefulSet:

See `references/multi-service-patterns.md#stateful-service` for pattern.

Add `volumeClaimTemplates` for persistent storage.

### Step 7: Generate Service Templates

See `references/chart-structure.md#service-template`.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ include "<chart>.fullname" . }}-<service>
  labels:
    {{- include "<chart>.labels" . | nindent 4 }}
spec:
  type: {{ .Values.<service>.service.type }}
  ports:
  - port: {{ .Values.<service>.service.port }}
    targetPort: {{ .Values.<service>.service.port }}
    protocol: TCP
    name: http
  selector:
    app: <service>
```

### Step 8: Generate ConfigMap Templates

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "<chart>.fullname" . }}-<service>-config
data:
  {{- range $key, $value := .Values.<service>.config }}
  {{ $key }}: {{ $value | quote }}
  {{- end }}
```

### Step 9: Generate Secret Template (Example Only)

**NEVER include actual secrets in chart templates.**

Create `templates/secret.yaml.example`:

```yaml
# Example: Create this secret manually before installing chart
# kubectl create secret generic app-secrets \
#   --from-literal=database-url="postgresql://..." \
#   --from-literal=api-key="..." \
#   --namespace=<namespace>

apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
data:
  # Base64 encoded values
  # database-url: <base64>
  # api-key: <base64>
```

### Step 10: Generate Ingress Template (If Needed)

See `references/multi-service-patterns.md#ingress-routing`.

```yaml
{{- if .Values.ingress.enabled -}}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ include "<chart>.fullname" . }}
  annotations:
    {{- toYaml .Values.ingress.annotations | nindent 4 }}
spec:
  {{- if .Values.ingress.tls }}
  tls:
  - hosts:
    - {{ .Values.ingress.host }}
    secretName: {{ .Values.ingress.tlsSecret }}
  {{- end }}
  rules:
  - host: {{ .Values.ingress.host }}
    http:
      paths:
      {{- range .Values.ingress.paths }}
      - path: {{ .path }}
        pathType: Prefix
        backend:
          service:
            name: {{ .serviceName }}
            port:
              number: {{ .servicePort }}
      {{- end }}
{{- end }}
```

### Step 11: Generate _helpers.tpl

See `references/chart-structure.md#helper-templates`.

**Essential helpers:**
```yaml
{{/*
Expand the name of the chart.
*/}}
{{- define "<chart>.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "<chart>.fullname" -}}
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
{{- define "<chart>.labels" -}}
helm.sh/chart: {{ include "<chart>.chart" . }}
{{ include "<chart>.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "<chart>.selectorLabels" -}}
app.kubernetes.io/name: {{ include "<chart>.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
```

### Step 12: Generate NOTES.txt

```
Thank you for installing {{ .Chart.Name }}.

Your release is named {{ .Release.Name }}.

To access your application:

{{- if .Values.ingress.enabled }}
  Visit: https://{{ .Values.ingress.host }}
{{- else }}
  Run these commands:
  export POD_NAME=$(kubectl get pods --namespace {{ .Release.Namespace }} -l "app=<service>" -o jsonpath="{.items[0].metadata.name}")
  kubectl port-forward $POD_NAME 8080:<port>
  Visit: http://localhost:8080
{{- end }}

Get pods status:
  kubectl get pods -n {{ .Release.Namespace }}

View logs:
  kubectl logs -f deployment/{{ include "<chart>.fullname" . }}-<service> -n {{ .Release.Namespace }}
```

---

## Security Hardening Checklist

Apply all items from `references/security-hardening.md`:

- [ ] Pod security contexts set (runAsNonRoot, runAsUser, fsGroup)
- [ ] Container security contexts set (allowPrivilegeEscalation: false, readOnlyRootFilesystem: true)
- [ ] Resource limits defined for all containers
- [ ] Health probes configured (liveness, readiness)
- [ ] Secrets never in values.yaml (use external secret management)
- [ ] Service accounts created with minimal permissions
- [ ] Network policies defined (if required)
- [ ] Image pull policy set correctly (Always for prod)
- [ ] No privileged containers
- [ ] No host network/PID/IPC

---

## Validation Workflow

Before delivering chart:

### 1. Lint Chart
```bash
helm lint <chart-name>
```

Fix any errors or warnings.

### 2. Template Dry-Run
```bash
helm template <chart-name> ./<chart-name> -f ./<chart-name>/values-dev.yaml
```

Verify generated manifests look correct.

### 3. Install Dry-Run
```bash
helm install --dry-run --debug <release-name> ./<chart-name> -f ./<chart-name>/values-dev.yaml
```

Check for Kubernetes API validation errors.

### 4. Test Installation (Optional)
```bash
# Create test namespace
kubectl create namespace helm-test

# Install chart
helm install test-release ./<chart-name> -f ./<chart-name>/values-dev.yaml -n helm-test

# Verify pods running
kubectl get pods -n helm-test

# Cleanup
helm uninstall test-release -n helm-test
kubectl delete namespace helm-test
```

---

## Output Checklist

Verify generated chart includes:

### Structure
- [ ] Chart.yaml with correct metadata
- [ ] values.yaml with all service configurations
- [ ] values-dev.yaml, values-staging.yaml, values-prod.yaml
- [ ] templates/_helpers.tpl with common functions
- [ ] templates/NOTES.txt with access instructions

### Per Service
- [ ] Deployment (or StatefulSet) template
- [ ] Service template
- [ ] ConfigMap template (if config needed)

### Cross-Cutting
- [ ] secret.yaml.example (never with actual secrets)
- [ ] ingress.yaml (if ingress needed)
- [ ] README.md with usage instructions

### Quality
- [ ] All templates use helpers for labels
- [ ] Security contexts configured
- [ ] Resource limits set
- [ ] Health probes defined
- [ ] Values properly parameterized
- [ ] Helm lint passes
- [ ] Template dry-run succeeds

---

## Common Patterns

See `references/multi-service-patterns.md` for detailed examples:

- Multi-service application (backend + frontend + database)
- Microservices with shared ConfigMaps/Secrets
- StatefulSet with persistent volumes
- Ingress with path-based routing
- Init containers for migrations
- Sidecar containers for logging

---

## Reference Files

| File | Purpose |
|------|---------|
| `references/helm-3-best-practices.md` | Helm 3 conventions, semantic versioning, hooks |
| `references/chart-structure.md` | Chart.yaml spec, directory layout, helper templates |
| `references/multi-service-patterns.md` | Complete examples for common deployment patterns |
| `references/security-hardening.md` | Security contexts, RBAC, network policies |
| `references/examples/complete-chart.yaml` | Full working example for 3-service app |
