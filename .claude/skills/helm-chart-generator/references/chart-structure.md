# Helm Chart Structure

Complete reference for Helm 3 chart directory layout and file specifications.

## Standard Directory Layout

```
<chart-name>/
├── Chart.yaml              # Chart metadata (REQUIRED)
├── values.yaml             # Default configuration values (REQUIRED)
├── values-dev.yaml         # Development environment overrides
├── values-staging.yaml     # Staging environment overrides
├── values-prod.yaml        # Production environment overrides
├── values.schema.json      # JSON schema for values validation (optional)
├── templates/              # Kubernetes manifests (REQUIRED)
│   ├── NOTES.txt          # Post-install usage notes
│   ├── _helpers.tpl       # Template helpers (labels, names, etc.)
│   ├── deployment.yaml    # Deployment manifest(s)
│   ├── service.yaml       # Service manifest(s)
│   ├── configmap.yaml     # ConfigMap manifest(s)
│   ├── secret.yaml.example # Secret example (NEVER actual secrets)
│   ├── ingress.yaml       # Ingress manifest (if needed)
│   ├── serviceaccount.yaml # ServiceAccount (if RBAC needed)
│   ├── role.yaml          # Role (if RBAC needed)
│   ├── rolebinding.yaml   # RoleBinding (if RBAC needed)
│   └── tests/             # Test pods
│       └── test-connection.yaml
├── charts/                 # Dependency charts (auto-generated)
├── Chart.lock             # Dependency lock file (auto-generated)
├── .helmignore            # Files to exclude from packaging
└── README.md              # Usage documentation
```

## Chart.yaml Specification

### Required Fields

```yaml
apiVersion: v2              # Helm 3 uses v2
name: my-app                # Chart name (lowercase, hyphens)
description: |              # Brief description
  A Helm chart for deploying My Application to Kubernetes
type: application           # "application" or "library"
version: 1.0.0             # Chart version (SemVer)
appVersion: "1.0.0"        # Application version
```

### Optional Fields

```yaml
keywords:
  - web
  - api
  - microservice

home: https://example.com
sources:
  - https://github.com/org/repo

maintainers:
  - name: Your Name
    email: you@example.com

icon: https://example.com/icon.svg

# Kubernetes version requirements
kubeVersion: ">=1.19.0-0"

# Dependencies (other charts)
dependencies:
  - name: postgresql
    version: "12.1.0"
    repository: "https://charts.bitnami.com/bitnami"
    condition: postgresql.enabled
    tags:
      - database
    import-values:
      - child: postgresql.auth
        parent: auth.postgres

# Deprecation notice
deprecated: false
# annotations:
#   category: Application
```

## values.yaml Structure

### Recommended Organization

```yaml
# Global settings (shared across all services)
global:
  environment: production
  namespace: default
  labels: {}

# Image pull secrets (for private registries)
imagePullSecrets: []

# Service Account
serviceAccount:
  create: true
  name: ""
  annotations: {}

# Per-Service Configuration
<service-name>:
  enabled: true
  replicaCount: 2

  image:
    repository: myorg/myapp
    tag: "latest"
    pullPolicy: IfNotPresent

  service:
    type: ClusterIP
    port: 8000
    targetPort: 8000
    annotations: {}

  resources:
    requests:
      memory: "256Mi"
      cpu: "250m"
    limits:
      memory: "512Mi"
      cpu: "500m"

  autoscaling:
    enabled: false
    minReplicas: 2
    maxReplicas: 10
    targetCPUUtilizationPercentage: 80

  livenessProbe:
    httpGet:
      path: /health
      port: 8000
    initialDelaySeconds: 10
    periodSeconds: 30

  readinessProbe:
    httpGet:
      path: /ready
      port: 8000
    initialDelaySeconds: 5
    periodSeconds: 10

  env: []
  # - name: LOG_LEVEL
  #   value: "info"

  envFrom: []
  # - configMapRef:
  #     name: app-config
  # - secretRef:
  #     name: app-secrets

  nodeSelector: {}
  tolerations: []
  affinity: {}

# Ingress Configuration
ingress:
  enabled: false
  className: nginx
  annotations: {}
  # cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: example.com
      paths:
        - path: /
          pathType: Prefix
  tls: []
  # - secretName: example-tls
  #   hosts:
  #     - example.com

# Network Policy
networkPolicy:
  enabled: false
  policyTypes:
    - Ingress
    - Egress

# Pod Disruption Budget
podDisruptionBudget:
  enabled: false
  minAvailable: 1
```

## Template Structure

### Deployment Template

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "<chart>.fullname" . }}-<service>
  labels:
    {{- include "<chart>.labels" . | nindent 4 }}
    app.kubernetes.io/component: <service>
spec:
  {{- if not .Values.<service>.autoscaling.enabled }}
  replicas: {{ .Values.<service>.replicaCount }}
  {{- end }}
  selector:
    matchLabels:
      {{- include "<chart>.selectorLabels" . | nindent 6 }}
      app.kubernetes.io/component: <service>
  template:
    metadata:
      annotations:
        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
      labels:
        {{- include "<chart>.selectorLabels" . | nindent 8 }}
        app.kubernetes.io/component: <service>
    spec:
      {{- with .Values.imagePullSecrets }}
      imagePullSecrets:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      serviceAccountName: {{ include "<chart>.serviceAccountName" . }}
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
      containers:
      - name: <service>
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL
        image: "{{ .Values.<service>.image.repository }}:{{ .Values.<service>.image.tag | default .Chart.AppVersion }}"
        imagePullPolicy: {{ .Values.<service>.image.pullPolicy }}
        ports:
        - name: http
          containerPort: {{ .Values.<service>.service.targetPort }}
          protocol: TCP
        {{- with .Values.<service>.livenessProbe }}
        livenessProbe:
          {{- toYaml . | nindent 10 }}
        {{- end }}
        {{- with .Values.<service>.readinessProbe }}
        readinessProbe:
          {{- toYaml . | nindent 10 }}
        {{- end }}
        {{- with .Values.<service>.resources }}
        resources:
          {{- toYaml . | nindent 10 }}
        {{- end }}
        {{- with .Values.<service>.env }}
        env:
          {{- toYaml . | nindent 10 }}
        {{- end }}
        {{- with .Values.<service>.envFrom }}
        envFrom:
          {{- toYaml . | nindent 10 }}
        {{- end }}
        volumeMounts:
        - name: tmp
          mountPath: /tmp
      volumes:
      - name: tmp
        emptyDir: {}
      {{- with .Values.<service>.nodeSelector }}
      nodeSelector:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.<service>.affinity }}
      affinity:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.<service>.tolerations }}
      tolerations:
        {{- toYaml . | nindent 8 }}
      {{- end }}
```

### Service Template

```yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ include "<chart>.fullname" . }}-<service>
  labels:
    {{- include "<chart>.labels" . | nindent 4 }}
    app.kubernetes.io/component: <service>
  {{- with .Values.<service>.service.annotations }}
  annotations:
    {{- toYaml . | nindent 4 }}
  {{- end }}
spec:
  type: {{ .Values.<service>.service.type }}
  ports:
  - port: {{ .Values.<service>.service.port }}
    targetPort: http
    protocol: TCP
    name: http
  selector:
    {{- include "<chart>.selectorLabels" . | nindent 4 }}
    app.kubernetes.io/component: <service>
```

### ConfigMap Template

```yaml
{{- if .Values.<service>.config }}
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "<chart>.fullname" . }}-<service>-config
  labels:
    {{- include "<chart>.labels" . | nindent 4 }}
data:
  {{- range $key, $value := .Values.<service>.config }}
  {{ $key }}: {{ $value | quote }}
  {{- end }}
{{- end }}
```

## Helper Templates (_helpers.tpl)

### Essential Helpers

```yaml
{{/*
Expand the name of the chart.
*/}}
{{- define "<chart>.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
Truncate at 63 chars (Kubernetes name length limit).
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
Create chart name and version as used by the chart label.
*/}}
{{- define "<chart>.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
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
{{- if .Values.global.labels }}
{{ toYaml .Values.global.labels }}
{{- end }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "<chart>.selectorLabels" -}}
app.kubernetes.io/name: {{ include "<chart>.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "<chart>.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "<chart>.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
```

## NOTES.txt Template

```
1. Get the application URL by running these commands:
{{- if .Values.ingress.enabled }}
{{- range $host := .Values.ingress.hosts }}
  {{- range .paths }}
  http{{ if $.Values.ingress.tls }}s{{ end }}://{{ $host.host }}{{ .path }}
  {{- end }}
{{- end }}
{{- else if contains "NodePort" .Values.<service>.service.type }}
  export NODE_PORT=$(kubectl get --namespace {{ .Release.Namespace }} -o jsonpath="{.spec.ports[0].nodePort}" services {{ include "<chart>.fullname" . }})
  export NODE_IP=$(kubectl get nodes --namespace {{ .Release.Namespace }} -o jsonpath="{.items[0].status.addresses[0].address}")
  echo http://$NODE_IP:$NODE_PORT
{{- else if contains "LoadBalancer" .Values.<service>.service.type }}
     NOTE: It may take a few minutes for the LoadBalancer IP to be available.
           You can watch the status by running 'kubectl get --namespace {{ .Release.Namespace }} svc -w {{ include "<chart>.fullname" . }}'
  export SERVICE_IP=$(kubectl get svc --namespace {{ .Release.Namespace }} {{ include "<chart>.fullname" . }} --template "{{"{{ range (index .status.loadBalancer.ingress 0) }}{{.}}{{ end }}"}}")
  echo http://$SERVICE_IP:{{ .Values.<service>.service.port }}
{{- else if contains "ClusterIP" .Values.<service>.service.type }}
  export POD_NAME=$(kubectl get pods --namespace {{ .Release.Namespace }} -l "app.kubernetes.io/name={{ include "<chart>.name" . }},app.kubernetes.io/instance={{ .Release.Name }}" -o jsonpath="{.items[0].metadata.name}")
  export CONTAINER_PORT=$(kubectl get pod --namespace {{ .Release.Namespace }} $POD_NAME -o jsonpath="{.spec.containers[0].ports[0].containerPort}")
  echo "Visit http://127.0.0.1:8080 to use your application"
  kubectl --namespace {{ .Release.Namespace }} port-forward $POD_NAME 8080:$CONTAINER_PORT
{{- end }}

2. Check the status of your deployment:
  kubectl get pods -n {{ .Release.Namespace }} -l "app.kubernetes.io/instance={{ .Release.Name }}"

3. View logs:
  kubectl logs -f deployment/{{ include "<chart>.fullname" . }}-<service> -n {{ .Release.Namespace }}
```

## .helmignore

```
# Patterns to ignore when building packages
.DS_Store
*.swp
*.bak
*.tmp
*.orig
*~

# Development files
.git/
.gitignore
.vscode/
.idea/
*.iml

# CI/CD files
.travis.yml
.gitlab-ci.yml
Jenkinsfile

# Documentation (if not needed in package)
docs/

# Test files
test/
tests/

# Build artifacts
*.tgz

# Environment files
.env
.env.*
!.env.example
```

## Chart Validation Commands

```bash
# Lint chart (check for issues)
helm lint <chart-dir>

# Generate manifests (dry-run)
helm template <release-name> <chart-dir>

# Install dry-run (validate with Kubernetes API)
helm install --dry-run --debug <release-name> <chart-dir>

# Package chart
helm package <chart-dir>

# Verify chart integrity
helm verify <chart-package>.tgz
```
