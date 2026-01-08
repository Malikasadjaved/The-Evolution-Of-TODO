# Blueprint: Kubernetes Service

**Purpose:** Standard pattern for exposing applications running in Kubernetes pods with different access modes (ClusterIP, NodePort, LoadBalancer).

**When to Use:**
- Exposing applications to internal cluster traffic (ClusterIP)
- Exposing applications to external traffic on Minikube (NodePort)
- Exposing applications to external traffic on cloud providers (LoadBalancer)
- Implementing service discovery and load balancing

**Phase IV Constitution Reference:** Section III (Kubernetes-Native Design)

---

## Service Type Decision Matrix

| Type | Use Case | Access | Best For |
|------|----------|--------|----------|
| **ClusterIP** | Internal only | Cluster-internal DNS | Backend APIs, databases |
| **NodePort** | External (Minikube) | <NodeIP>:<NodePort> | Development, testing |
| **LoadBalancer** | External (Cloud) | Cloud provider LB | Production frontends |
| **ExternalName** | External service | DNS CNAME | Third-party APIs |

---

## Pattern 1: ClusterIP (Internal Services)

**Use For:** Backend APIs, internal microservices, databases

```yaml
apiVersion: v1
kind: Service
metadata:
  name: <app-name>-<service-name>
  labels:
    app: <service-name>
    tier: <api|database>
    phase: <phase-number>
spec:
  type: ClusterIP  # Internal only (default)

  selector:
    app: <service-name>  # Must match Deployment labels

  ports:
  - name: http
    protocol: TCP
    port: <service-port>        # Port exposed within cluster
    targetPort: <container-port> # Port on container
```

**Example (Backend API):**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: todo-app-backend
  labels:
    app: backend
    tier: api
    phase: phase-4
spec:
  type: ClusterIP
  selector:
    app: backend
  ports:
  - name: http
    protocol: TCP
    port: 8000
    targetPort: 8000
```

**Access:**
```bash
# From within cluster
http://todo-app-backend:8000

# From another namespace
http://todo-app-backend.default.svc.cluster.local:8000

# Port-forward for testing
kubectl port-forward svc/todo-app-backend 8000:8000
```

---

## Pattern 2: NodePort (Development/Minikube)

**Use For:** Frontend applications on Minikube, external access during development

```yaml
apiVersion: v1
kind: Service
metadata:
  name: <app-name>-<service-name>
  labels:
    app: <service-name>
    tier: web
    phase: <phase-number>
spec:
  type: NodePort

  selector:
    app: <service-name>

  ports:
  - name: http
    protocol: TCP
    port: <service-port>        # Port within cluster
    targetPort: <container-port> # Port on container
    nodePort: <30000-32767>     # Port on node (optional)
```

**Example (Frontend Web):**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: todo-app-frontend-web
  labels:
    app: frontend-web
    tier: web
    phase: phase-4
spec:
  type: NodePort
  selector:
    app: frontend-web
  ports:
  - name: http
    protocol: TCP
    port: 3000
    targetPort: 3000
    nodePort: 30000  # Fixed port for consistency
```

**Access:**
```bash
# Get Minikube URL
minikube service todo-app-frontend-web --url
# Expected: http://192.168.49.2:30000

# Direct access
http://<minikube-ip>:30000
```

**NodePort Range:**
- Default: 30000-32767
- Recommendation: Use explicit nodePort (30000, 30001, etc.) for consistency
- Avoid conflicts: Track used ports across services

---

## Pattern 3: LoadBalancer (Production/Cloud)

**Use For:** Production frontends on AWS, GCP, Azure

```yaml
apiVersion: v1
kind: Service
metadata:
  name: <app-name>-<service-name>
  labels:
    app: <service-name>
    tier: web
    phase: <phase-number>
  annotations:
    # Cloud-specific annotations
    service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
    service.beta.kubernetes.io/azure-load-balancer-internal: "false"
spec:
  type: LoadBalancer

  selector:
    app: <service-name>

  ports:
  - name: http
    protocol: TCP
    port: 80             # External port
    targetPort: 3000     # Container port
  - name: https
    protocol: TCP
    port: 443
    targetPort: 3000

  # Optional: Static IP
  loadBalancerIP: <static-ip>
```

**Access:**
```bash
# Get external IP
kubectl get svc todo-app-frontend-web
# Wait for EXTERNAL-IP (may take 1-2 minutes)

# Access via external IP
http://<external-ip>
```

---

## Pattern 4: Headless Service (StatefulSets)

**Use For:** StatefulSets, direct pod access, service discovery

```yaml
apiVersion: v1
kind: Service
metadata:
  name: <app-name>-<service-name>-headless
  labels:
    app: <service-name>
spec:
  clusterIP: None  # Headless (no load balancing)

  selector:
    app: <service-name>

  ports:
  - name: http
    protocol: TCP
    port: <port>
    targetPort: <port>
```

**Access:**
```bash
# Direct pod DNS
<pod-name>.<service-name>.default.svc.cluster.local
```

---

## Field Reference

### Metadata
- **name**: Format: `<app-name>-<service-name>` (e.g., `todo-app-backend`)
- **labels**: Same convention as Deployments (app, tier, phase)

### Selector
- **CRITICAL**: Must match Deployment pod labels exactly
- Mismatch causes "no endpoints" error
```bash
# Verify selector match
kubectl get svc <service-name> -o yaml | grep -A 3 "selector:"
kubectl get pods --show-labels
```

### Ports
- **port**: Port exposed by service (within cluster)
- **targetPort**: Port on container (must match EXPOSE in Dockerfile)
- **nodePort**: Port on node (30000-32767 range, NodePort only)
- **protocol**: TCP (default) or UDP

### Session Affinity (Sticky Sessions)
```yaml
spec:
  sessionAffinity: ClientIP
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 3600  # 1 hour
```

---

## Multi-Port Service Example

**Backend with HTTP and Metrics:**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: todo-app-backend
spec:
  type: ClusterIP
  selector:
    app: backend
  ports:
  - name: http
    protocol: TCP
    port: 8000
    targetPort: 8000
  - name: metrics
    protocol: TCP
    port: 9090
    targetPort: 9090
```

---

## Validation Checklist

Before applying service:

- [ ] Selector matches Deployment pod labels
- [ ] Ports defined (port, targetPort)
- [ ] Service type appropriate for environment (ClusterIP, NodePort, LoadBalancer)
- [ ] NodePort in valid range (30000-32767) if applicable
- [ ] No port conflicts with existing services
- [ ] Service name follows convention
- [ ] Labels applied for organization

---

## Common Issues & Fixes

### Issue 1: Service Has No Endpoints
**Symptom:** `kubectl get endpoints <service-name>` shows no IPs

**Diagnosis:**
```bash
# Check service selector
kubectl get svc <service-name> -o yaml | grep -A 3 "selector:"

# Check pod labels
kubectl get pods --show-labels

# Compare: selector must match pod labels exactly
```

**Fix:** Update selector to match pod labels

---

### Issue 2: NodePort Not Accessible
**Symptom:** Cannot access `http://<minikube-ip>:<nodePort>`

**Diagnosis:**
```bash
# Check Minikube IP
minikube ip

# Check service
kubectl get svc <service-name>

# Check pods are ready
kubectl get pods -l app=<service-name>
```

**Fix Options:**
1. Use `minikube service <service-name> --url` for correct URL
2. Check firewall rules
3. Use `kubectl port-forward` as alternative

---

### Issue 3: LoadBalancer Stuck Pending
**Symptom:** EXTERNAL-IP shows `<pending>` indefinitely

**Root Cause:** LoadBalancer only works on cloud providers (AWS, GCP, Azure)

**Fix for Minikube:**
```bash
# Use NodePort instead
kubectl patch svc <service-name> -p '{"spec":{"type":"NodePort"}}'

# Or use minikube tunnel (simulates LoadBalancer)
minikube tunnel
```

---

## Helm Templating

**Service Template:**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ include "todo-app.fullname" . }}-{{ .Values.service.name }}
  labels:
    {{- include "todo-app.labels" . | nindent 4 }}
spec:
  type: {{ .Values.service.type }}
  selector:
    {{- include "todo-app.selectorLabels" . | nindent 4 }}
  ports:
  - name: http
    protocol: TCP
    port: {{ .Values.service.port }}
    targetPort: {{ .Values.service.port }}
    {{- if eq .Values.service.type "NodePort" }}
    nodePort: {{ .Values.service.nodePort }}
    {{- end }}
```

**Values:**
```yaml
service:
  name: backend
  type: ClusterIP
  port: 8000
  nodePort: 30000  # Only used if type: NodePort
```

---

## Testing Service Connectivity

```bash
# Test from within cluster
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- sh
curl http://<service-name>:<port>/health

# Test port-forward
kubectl port-forward svc/<service-name> 8000:8000
curl http://localhost:8000/health

# Test NodePort (Minikube)
minikube service <service-name> --url
curl $(minikube service <service-name> --url)/health

# Test LoadBalancer
kubectl get svc <service-name>
curl http://<external-ip>/health
```

---

## References

- Phase IV Constitution: `.specify/memory/phase-4-constitution.md` (Section III)
- Skill: `.specify/skills/k8s-troubleshoot.skill.md` (Section 5: Service Unreachable)
- Example: `k8s/backend-service.yaml`, `k8s/frontend-web-service.yaml`

---

**Blueprint Version:** 1.0.0 | **Phase:** IV | **Last Updated:** 2026-01-03
