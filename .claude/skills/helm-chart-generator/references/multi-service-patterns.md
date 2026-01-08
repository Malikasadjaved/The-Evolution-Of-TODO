# Multi-Service Patterns

Complete examples for common multi-service application deployments.

## Pattern 1: Stateless Multi-Service Application

**Architecture**: Backend API + Frontend Web + Frontend Chatbot

### Directory Structure

```
my-app/
├── Chart.yaml
├── values.yaml
├── values-dev.yaml
├── values-prod.yaml
├── templates/
│   ├── _helpers.tpl
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── frontend-web-deployment.yaml
│   ├── frontend-web-service.yaml
│   ├── frontend-chatbot-deployment.yaml
│   ├── frontend-chatbot-service.yaml
│   ├── configmap.yaml
│   └── ingress.yaml
```

### values.yaml (Stateless Multi-Service)

```yaml
global:
  environment: production
  namespace: default

# Backend Service
backend:
  enabled: true
  replicaCount: 2

  image:
    repository: myorg/backend
    tag: "1.0.0"
    pullPolicy: Always

  service:
    type: ClusterIP
    port: 8000
    targetPort: 8000

  resources:
    requests:
      memory: "256Mi"
      cpu: "250m"
    limits:
      memory: "512Mi"
      cpu: "500m"

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

  env:
    - name: LOG_LEVEL
      value: "info"
    - name: DATABASE_URL
      valueFrom:
        secretKeyRef:
          name: app-secrets
          key: database-url
    - name: API_KEY
      valueFrom:
        secretKeyRef:
          name: app-secrets
          key: openai-api-key

# Frontend Web Service
frontendWeb:
  enabled: true
  replicaCount: 2

  image:
    repository: myorg/frontend-web
    tag: "1.0.0"
    pullPolicy: Always

  service:
    type: ClusterIP
    port: 3000
    targetPort: 3000

  resources:
    requests:
      memory: "128Mi"
      cpu: "100m"
    limits:
      memory: "256Mi"
      cpu: "200m"

  livenessProbe:
    httpGet:
      path: /
      port: 3000
    initialDelaySeconds: 15
    periodSeconds: 30

  readinessProbe:
    httpGet:
      path: /
      port: 3000
    initialDelaySeconds: 10
    periodSeconds: 10

  env:
    - name: NEXT_PUBLIC_API_URL
      value: "http://backend:8000"

# Frontend Chatbot Service
frontendChatbot:
  enabled: true
  replicaCount: 2

  image:
    repository: myorg/frontend-chatbot
    tag: "1.0.0"
    pullPolicy: Always

  service:
    type: ClusterIP
    port: 3001
    targetPort: 3001

  resources:
    requests:
      memory: "128Mi"
      cpu: "100m"
    limits:
      memory: "256Mi"
      cpu: "200m"

  livenessProbe:
    httpGet:
      path: /
      port: 3001
    initialDelaySeconds: 15
    periodSeconds: 30

  readinessProbe:
    httpGet:
      path: /
      port: 3001
    initialDelaySeconds: 10
    periodSeconds: 10

  env:
    - name: VITE_API_URL
      value: "http://backend:8000"

# Ingress Configuration
ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
  host: myapp.example.com
  tls:
    enabled: true
    secretName: myapp-tls
  paths:
    - path: /api
      pathType: Prefix
      serviceName: backend
      servicePort: 8000
    - path: /chat
      pathType: Prefix
      serviceName: frontend-chatbot
      servicePort: 3001
    - path: /
      pathType: Prefix
      serviceName: frontend-web
      servicePort: 3000
```

### backend-deployment.yaml

```yaml
{{- if .Values.backend.enabled -}}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "my-app.fullname" . }}-backend
  namespace: {{ .Values.global.namespace }}
  labels:
    {{- include "my-app.labels" . | nindent 4 }}
    app.kubernetes.io/component: backend
spec:
  {{- if not .Values.backend.autoscaling.enabled }}
  replicas: {{ .Values.backend.replicaCount }}
  {{- end }}
  selector:
    matchLabels:
      {{- include "my-app.selectorLabels" . | nindent 6 }}
      app.kubernetes.io/component: backend
  template:
    metadata:
      annotations:
        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
      labels:
        {{- include "my-app.selectorLabels" . | nindent 8 }}
        app.kubernetes.io/component: backend
    spec:
      serviceAccountName: {{ include "my-app.serviceAccountName" . }}
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
      containers:
      - name: backend
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL
        image: "{{ .Values.backend.image.repository }}:{{ .Values.backend.image.tag | default .Chart.AppVersion }}"
        imagePullPolicy: {{ .Values.backend.image.pullPolicy }}
        ports:
        - name: http
          containerPort: {{ .Values.backend.service.targetPort }}
          protocol: TCP
        {{- with .Values.backend.livenessProbe }}
        livenessProbe:
          {{- toYaml . | nindent 10 }}
        {{- end }}
        {{- with .Values.backend.readinessProbe }}
        readinessProbe:
          {{- toYaml . | nindent 10 }}
        {{- end }}
        {{- with .Values.backend.resources }}
        resources:
          {{- toYaml . | nindent 10 }}
        {{- end }}
        {{- with .Values.backend.env }}
        env:
          {{- toYaml . | nindent 10 }}
        {{- end }}
        volumeMounts:
        - name: tmp
          mountPath: /tmp
        - name: cache
          mountPath: /app/.cache
      volumes:
      - name: tmp
        emptyDir: {}
      - name: cache
        emptyDir: {}
{{- end }}
```

### ingress.yaml (Multi-Service Routing)

```yaml
{{- if .Values.ingress.enabled -}}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ include "my-app.fullname" . }}
  namespace: {{ .Values.global.namespace }}
  labels:
    {{- include "my-app.labels" . | nindent 4 }}
  {{- with .Values.ingress.annotations }}
  annotations:
    {{- toYaml . | nindent 4 }}
  {{- end }}
spec:
  ingressClassName: {{ .Values.ingress.className }}
  {{- if .Values.ingress.tls.enabled }}
  tls:
  - hosts:
    - {{ .Values.ingress.host }}
    secretName: {{ .Values.ingress.tls.secretName }}
  {{- end }}
  rules:
  - host: {{ .Values.ingress.host }}
    http:
      paths:
      {{- range .Values.ingress.paths }}
      - path: {{ .path }}
        pathType: {{ .pathType }}
        backend:
          service:
            name: {{ include "my-app.fullname" $ }}-{{ .serviceName }}
            port:
              number: {{ .servicePort }}
      {{- end }}
{{- end }}
```

---

## Pattern 2: Stateful Service with Persistent Storage

**Use Case**: PostgreSQL database with persistent volumes

### values.yaml (Stateful Service)

```yaml
database:
  enabled: true
  replicaCount: 1  # StatefulSets should start with 1

  image:
    repository: postgres
    tag: "15-alpine"
    pullPolicy: IfNotPresent

  service:
    type: ClusterIP
    port: 5432
    targetPort: 5432

  # Persistent Volume Claim
  persistence:
    enabled: true
    storageClass: "standard"  # or "gp2" for AWS
    accessMode: ReadWriteOnce
    size: 10Gi

  resources:
    requests:
      memory: "512Mi"
      cpu: "500m"
    limits:
      memory: "1Gi"
      cpu: "1000m"

  livenessProbe:
    exec:
      command:
      - pg_isready
      - -U
      - postgres
    initialDelaySeconds: 30
    periodSeconds: 10

  readinessProbe:
    exec:
      command:
      - pg_isready
      - -U
      - postgres
    initialDelaySeconds: 5
    periodSeconds: 5

  env:
    - name: POSTGRES_DB
      value: "myapp"
    - name: POSTGRES_USER
      value: "myapp"
    - name: POSTGRES_PASSWORD
      valueFrom:
        secretKeyRef:
          name: app-secrets
          key: database-password
    - name: PGDATA
      value: "/var/lib/postgresql/data/pgdata"
```

### database-statefulset.yaml

```yaml
{{- if .Values.database.enabled -}}
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: {{ include "my-app.fullname" . }}-database
  namespace: {{ .Values.global.namespace }}
  labels:
    {{- include "my-app.labels" . | nindent 4 }}
    app.kubernetes.io/component: database
spec:
  serviceName: {{ include "my-app.fullname" . }}-database
  replicas: {{ .Values.database.replicaCount }}
  selector:
    matchLabels:
      {{- include "my-app.selectorLabels" . | nindent 6 }}
      app.kubernetes.io/component: database
  template:
    metadata:
      labels:
        {{- include "my-app.selectorLabels" . | nindent 8 }}
        app.kubernetes.io/component: database
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 999  # postgres user
        fsGroup: 999
      containers:
      - name: postgres
        image: "{{ .Values.database.image.repository }}:{{ .Values.database.image.tag }}"
        imagePullPolicy: {{ .Values.database.image.pullPolicy }}
        ports:
        - name: postgres
          containerPort: {{ .Values.database.service.targetPort }}
          protocol: TCP
        {{- with .Values.database.livenessProbe }}
        livenessProbe:
          {{- toYaml . | nindent 10 }}
        {{- end }}
        {{- with .Values.database.readinessProbe }}
        readinessProbe:
          {{- toYaml . | nindent 10 }}
        {{- end }}
        {{- with .Values.database.resources }}
        resources:
          {{- toYaml . | nindent 10 }}
        {{- end }}
        {{- with .Values.database.env }}
        env:
          {{- toYaml . | nindent 10 }}
        {{- end }}
        volumeMounts:
        - name: data
          mountPath: /var/lib/postgresql/data
  {{- if .Values.database.persistence.enabled }}
  volumeClaimTemplates:
  - metadata:
      name: data
      labels:
        {{- include "my-app.labels" . | nindent 8 }}
    spec:
      accessModes:
      - {{ .Values.database.persistence.accessMode }}
      {{- if .Values.database.persistence.storageClass }}
      storageClassName: {{ .Values.database.persistence.storageClass }}
      {{- end }}
      resources:
        requests:
          storage: {{ .Values.database.persistence.size }}
  {{- else }}
      volumes:
      - name: data
        emptyDir: {}
  {{- end }}
{{- end }}
```

---

## Pattern 3: Init Containers for Database Migration

**Use Case**: Run database migrations before starting the main application

### values.yaml (with Init Container)

```yaml
backend:
  enabled: true
  replicaCount: 2

  image:
    repository: myorg/backend
    tag: "1.0.0"
    pullPolicy: Always

  # Init container for migrations
  initContainers:
    migration:
      enabled: true
      image:
        repository: myorg/backend
        tag: "1.0.0"
      command: ["python", "-m", "alembic", "upgrade", "head"]
      env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
```

### backend-deployment.yaml (with Init Container)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "my-app.fullname" . }}-backend
spec:
  template:
    spec:
      {{- if .Values.backend.initContainers.migration.enabled }}
      initContainers:
      - name: migration
        image: "{{ .Values.backend.initContainers.migration.image.repository }}:{{ .Values.backend.initContainers.migration.image.tag }}"
        command:
          {{- toYaml .Values.backend.initContainers.migration.command | nindent 10 }}
        {{- with .Values.backend.initContainers.migration.env }}
        env:
          {{- toYaml . | nindent 10 }}
        {{- end }}
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL
        volumeMounts:
        - name: tmp
          mountPath: /tmp
      {{- end }}
      containers:
      - name: backend
        # ... main container spec ...
```

---

## Pattern 4: Sidecar Containers for Logging

**Use Case**: Fluentd sidecar for centralized logging

### values.yaml (with Sidecar)

```yaml
backend:
  enabled: true
  replicaCount: 2

  image:
    repository: myorg/backend
    tag: "1.0.0"

  # Sidecar container
  sidecars:
    fluentd:
      enabled: true
      image:
        repository: fluent/fluentd-kubernetes-daemonset
        tag: "v1.16-debian-1"
      resources:
        requests:
          memory: "64Mi"
          cpu: "50m"
        limits:
          memory: "128Mi"
          cpu: "100m"
      env:
        - name: FLUENT_ELASTICSEARCH_HOST
          value: "elasticsearch.logging.svc.cluster.local"
        - name: FLUENT_ELASTICSEARCH_PORT
          value: "9200"
```

### backend-deployment.yaml (with Sidecar)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "my-app.fullname" . }}-backend
spec:
  template:
    spec:
      containers:
      - name: backend
        # ... main container spec ...
        volumeMounts:
        - name: logs
          mountPath: /var/log/app

      {{- if .Values.backend.sidecars.fluentd.enabled }}
      - name: fluentd
        image: "{{ .Values.backend.sidecars.fluentd.image.repository }}:{{ .Values.backend.sidecars.fluentd.image.tag }}"
        {{- with .Values.backend.sidecars.fluentd.resources }}
        resources:
          {{- toYaml . | nindent 10 }}
        {{- end }}
        {{- with .Values.backend.sidecars.fluentd.env }}
        env:
          {{- toYaml . | nindent 10 }}
        {{- end }}
        volumeMounts:
        - name: logs
          mountPath: /var/log/app
          readOnly: true
      {{- end }}

      volumes:
      - name: logs
        emptyDir: {}
```

---

## Pattern 5: Shared ConfigMap for Multi-Service

**Use Case**: Common configuration used by multiple services

### values.yaml (Shared Config)

```yaml
# Shared configuration
sharedConfig:
  logLevel: "info"
  environment: "production"
  apiTimeout: "30s"
  maxRetries: "3"

backend:
  enabled: true
  configFrom:
    - configMapRef:
        name: shared-config

frontendWeb:
  enabled: true
  configFrom:
    - configMapRef:
        name: shared-config
```

### configmap.yaml (Shared)

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "my-app.fullname" . }}-shared-config
  namespace: {{ .Values.global.namespace }}
  labels:
    {{- include "my-app.labels" . | nindent 4 }}
data:
  {{- range $key, $value := .Values.sharedConfig }}
  {{ $key }}: {{ $value | quote }}
  {{- end }}
```

### Using Shared ConfigMap in Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "my-app.fullname" . }}-backend
spec:
  template:
    spec:
      containers:
      - name: backend
        {{- with .Values.backend.configFrom }}
        envFrom:
          {{- toYaml . | nindent 10 }}
        {{- end }}
```

---

## Pattern 6: Conditional Service Enabling

**Pattern**: Allow users to enable/disable services via values

### values.yaml (Feature Flags)

```yaml
# Feature toggles
features:
  backend: true
  frontendWeb: true
  frontendChatbot: false  # Disable chatbot in dev environment
  database: true
  redis: false  # Optional caching

backend:
  enabled: {{ .Values.features.backend }}
  # ... rest of config ...

frontendChatbot:
  enabled: {{ .Values.features.frontendChatbot }}
  # ... rest of config ...
```

### Template with Conditional Rendering

```yaml
{{- if and .Values.features.frontendChatbot .Values.frontendChatbot.enabled -}}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "my-app.fullname" . }}-frontend-chatbot
# ... deployment spec ...
{{- end }}
```

---

## Pattern 7: Environment-Specific Overrides

**Pattern**: Different configurations for dev, staging, prod

### values-dev.yaml (Development Overrides)

```yaml
global:
  environment: development

backend:
  replicaCount: 1
  image:
    pullPolicy: IfNotPresent
  resources:
    requests:
      memory: "128Mi"
      cpu: "100m"
    limits:
      memory: "256Mi"
      cpu: "200m"

database:
  persistence:
    enabled: false  # Use emptyDir in dev
    size: 1Gi

ingress:
  enabled: false  # Use port-forward in dev
```

### values-prod.yaml (Production Overrides)

```yaml
global:
  environment: production

backend:
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
  autoscaling:
    enabled: true
    minReplicas: 3
    maxReplicas: 10
    targetCPUUtilizationPercentage: 70

database:
  persistence:
    enabled: true
    storageClass: "gp3"
    size: 50Gi

ingress:
  enabled: true
  tls:
    enabled: true
```

### Installation Commands

```bash
# Development
helm install my-app ./my-app -f ./my-app/values-dev.yaml -n dev

# Production
helm install my-app ./my-app -f ./my-app/values-prod.yaml -n prod
```

---

## Complete Multi-Service Example Summary

**Typical 3-tier application chart structure:**

1. **Backend Deployment** - Stateless API service with:
   - Init container for database migrations
   - Health probes (liveness + readiness)
   - Resource limits
   - Security contexts
   - Volume mounts for /tmp and cache

2. **Frontend Deployments** - Stateless UI services with:
   - Multiple frontend apps (web, chatbot)
   - Environment variables pointing to backend service
   - Health probes on root path
   - Lower resource requirements than backend

3. **Database StatefulSet** - Stateful storage with:
   - Persistent volume claims
   - Single replica (can scale later)
   - Exec-based health probes
   - Secrets for credentials

4. **Shared ConfigMap** - Common configuration:
   - Log levels
   - Environment names
   - API timeouts
   - Feature flags

5. **Ingress** - Path-based routing:
   - `/api/*` → backend service
   - `/chat/*` → chatbot service
   - `/*` → web frontend service
   - TLS termination
   - Rate limiting annotations

6. **Secrets** (created manually):
   - Database credentials
   - API keys
   - Auth secrets
