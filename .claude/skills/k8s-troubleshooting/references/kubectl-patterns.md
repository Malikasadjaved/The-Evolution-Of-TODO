# Kubectl Command Patterns & Shortcuts

## Essential Diagnostic Commands

### 1. Pod Status & Information

```bash
# Basic pod info
kubectl get pods
kubectl get pods -o wide                    # Show Node column
kubectl get pods <pod-name> -o yaml         # Full specification

# Pod description (best for troubleshooting)
kubectl describe pod <pod-name>             # Events + status + spec
kubectl describe pod <pod-name> -n <ns>     # In specific namespace

# List pods with labels
kubectl get pods --show-labels
kubectl get pods -l app=myapp               # Filter by label

# Watch pods in real-time
kubectl get pods -w                         # Watch all pods
kubectl get pods -w -l app=myapp            # Watch specific app
```

### 2. Logs & Event Inspection

```bash
# View container logs
kubectl logs <pod-name>                     # Current container
kubectl logs <pod-name> -c <container>      # Specific container
kubectl logs <pod-name> -f                  # Follow (tail -f)
kubectl logs <pod-name> --tail=100          # Last 100 lines
kubectl logs <pod-name> --timestamps=true   # Add timestamps

# Previous container logs (before crash)
kubectl logs <pod-name> --previous          # If container restarted
kubectl logs <pod-name> --previous -c <c>   # Previous specific container

# Multi-line context
kubectl logs <pod-name> --all-containers=true  # All containers in pod

# Cluster events (most recent)
kubectl get events --sort-by='.lastTimestamp'
kubectl get events --sort-by='.lastTimestamp' | tail -20
kubectl get events -n <namespace>           # Namespace-specific

# Pod-specific events
kubectl describe pod <pod-name>             # Shows Events at bottom
```

### 3. Resource Usage Monitoring

```bash
# Pod resource usage (requires metrics-server)
kubectl top pod <pod-name>
kubectl top pod <pod-name> --containers     # Per-container breakdown
kubectl top pods                            # All pods
kubectl top pods -A                         # All namespaces

# Node resource usage
kubectl top node
kubectl top node <node-name>

# Watch resources in real-time
kubectl top pods -w
kubectl top nodes -w

# Resource limits in pod
kubectl get pod <pod-name> -o yaml | grep -A 10 "resources:"
```

### 4. Service & Endpoint Discovery

```bash
# Service information
kubectl get svc <service-name>
kubectl get svc <service-name> -o yaml      # Full spec
kubectl describe svc <service-name>         # Service + endpoints

# Endpoint details (which pods behind service)
kubectl get endpoints <service-name>
kubectl get endpoints <service-name> -o yaml

# EndpointSlices (newer, larger clusters)
kubectl get endpointslices -l kubernetes.io/service-name=<svc-name>

# DNS verification from debug pod
kubectl run -it --rm debug --image=busybox:1.35 -- \
  nslookup <service-name>.default.svc.cluster.local

# Connectivity test from debug pod
kubectl run -it --rm debug --image=busybox:1.35 -- \
  wget -qO- http://<service-name>:<port> || echo "Failed"
```

### 5. Configuration & Secrets

```bash
# View ConfigMaps
kubectl get cm
kubectl get cm <cm-name> -o yaml

# View Secrets
kubectl get secrets
kubectl get secrets <secret-name> -o yaml   # (base64 encoded)

# Decode secret value
kubectl get secret <secret-name> \
  -o go-template='{{.data.password | base64decode}}'

# Environment variables from ConfigMap
kubectl get pod <pod-name> -o yaml | grep -A 20 "env:"
```

### 6. Deployment & Rollout Management

```bash
# Deployment status
kubectl get deployment <deployment-name>
kubectl describe deployment <deployment-name>

# Rollout history
kubectl rollout history deployment <deployment-name>
kubectl rollout history deployment <deployment-name> --revision=3

# Current rollout status
kubectl rollout status deployment <deployment-name>

# Restart deployment (force rollout)
kubectl rollout restart deployment <deployment-name>

# Rollback to previous version
kubectl rollout undo deployment <deployment-name>
kubectl rollout undo deployment <deployment-name> --to-revision=3

# Set new image
kubectl set image deployment/<dep> <container>=<image>:<tag>

# Set resource limits
kubectl set resources deployment/<dep> \
  --requests=cpu=100m,memory=128Mi \
  --limits=cpu=500m,memory=512Mi

# Scale deployment
kubectl scale deployment <deployment-name> --replicas=5
```

### 7. Node Information & Management

```bash
# Node status
kubectl get nodes
kubectl get nodes -o wide                   # Show internal/external IPs
kubectl describe node <node-name>           # Detailed node info

# Node labels and taints
kubectl get nodes --show-labels
kubectl describe node <node-name> | grep "Taints:"

# Add labels to node
kubectl label node <node-name> disk=ssd
kubectl label node <node-name> workload=gpu

# Taint node (prevent pods from scheduling)
kubectl taint node <node-name> maintenance=true:NoSchedule

# Remove taint
kubectl taint node <node-name> maintenance=true:NoSchedule-

# Drain node (for maintenance)
kubectl drain <node-name> --ignore-daemonsets
kubectl uncordon <node-name>
```

### 8. Interactive Debugging

```bash
# Execute command in running pod
kubectl exec -it <pod-name> -- /bin/bash
kubectl exec -it <pod-name> -c <container> -- /bin/bash

# View pod filesystem
kubectl exec <pod-name> -- ls -la /
kubectl exec <pod-name> -- cat /etc/hostname

# Network debugging from pod
kubectl exec -it <pod-name> -- sh
  # Inside: nslookup <service>
  # Inside: ping <ip-address>
  # Inside: curl http://<url>
  # Inside: netstat -tlnp

# Create temporary debug pod
kubectl run -it --rm debug --image=busybox:1.35 -- sh

# Debug existing pod (add debug container)
kubectl debug <pod-name> -it --image=busybox:1.35

# Port forwarding (access pod directly)
kubectl port-forward <pod-name> 8080:8080
# Now: curl localhost:8080 from your machine

# Port forward to service
kubectl port-forward svc/<service-name> 8080:8080
```

### 9. Namespace Management

```bash
# List namespaces
kubectl get ns

# Get resources in specific namespace
kubectl get pods -n <namespace>
kubectl get all -n <namespace>

# Create namespace
kubectl create ns <namespace-name>

# Set default namespace
kubectl config set-context --current --namespace=<namespace>

# View all resources across all namespaces
kubectl get pods -A
kubectl get deployment -A
kubectl get all -A
```

### 10. Advanced Queries

```bash
# Get pods with field selectors
kubectl get pods --field-selector=status.phase=Running
kubectl get pods --field-selector=status.phase=Pending
kubectl get pods --field-selector=spec.nodeName=<node-name>

# Custom columns output
kubectl get pods -o custom-columns=NAME:.metadata.name,STATUS:.status.phase,NODE:.spec.nodeName
kubectl get pods -o custom-columns=NAME:.metadata.name,CPU:.spec.containers[0].resources.requests.cpu,MEMORY:.spec.containers[0].resources.requests.memory

# JSONPath queries
kubectl get pod <pod-name> -o jsonpath='{.status.podIP}'
kubectl get pods -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}'

# Go template queries
kubectl get pod <pod-name> -o go-template='{{.metadata.name}}'
kubectl get pod <pod-name> -o go-template='{{range .status.containerStatuses}}{{.name}}: {{.state.terminated.exitCode}}{end}'
```

---

## Common Troubleshooting Patterns

### Pattern 1: "Pod crashed, what went wrong?"

```bash
# Step 1: Get crash info
kubectl describe pod <pod-name> | tail -20     # See events

# Step 2: Check logs before crash
kubectl logs <pod-name> --previous --tail=50

# Step 3: If no previous logs (first crash)
kubectl logs <pod-name> --tail=50

# Step 4: Check resource limits
kubectl get pod <pod-name> -o yaml | grep -A 5 limits:

# Result: Use findings to fix deployment
```

### Pattern 2: "Service not reachable"

```bash
# Step 1: Service exists?
kubectl get svc <service-name>

# Step 2: Service has endpoints?
kubectl get endpoints <service-name>

# Step 3: DNS works?
kubectl run -it --rm debug --image=busybox:1.35 -- \
  nslookup <service-name>.default.svc.cluster.local

# Step 4: Port forward to test
kubectl port-forward svc/<service-name> 8080:8080
# In another terminal: curl localhost:8080

# Result: Fix selector, port config, or network policy
```

### Pattern 3: "Pod won't schedule"

```bash
# Step 1: Why pending?
kubectl describe pod <pod-name> | grep -A 10 "Events:"

# Step 2: Node resources?
kubectl top nodes
kubectl describe node <node-name> | grep -A 15 "Allocated resources"

# Step 3: Node selector match?
kubectl get nodes --show-labels
kubectl get pod <pod-name> -o yaml | grep nodeSelector

# Result: Add nodes, fix selector, or adjust requests
```

### Pattern 4: "Container running but slow"

```bash
# Step 1: CPU/memory usage
kubectl top pod <pod-name> --containers

# Step 2: Is it throttled?
# CPU at limit? Memory near limit?

# Step 3: Node pressure?
kubectl describe node <node-name> | grep "Pressure:"

# Step 4: Liveness probe too aggressive?
kubectl get pod <pod-name> -o yaml | grep -A 5 livenessProbe

# Result: Increase limits, adjust probes, or scale out
```

---

## Time-Saving Shortcuts

```bash
# Create alias for common commands
alias kctx='kubectl config current-context'
alias kns='kubectl config set-context --current --namespace'
alias kgp='kubectl get pods'
alias kdp='kubectl describe pod'
alias klogs='kubectl logs'
alias kexec='kubectl exec -it'

# View all resources in namespace
kubectl get all -n <namespace>

# Quick pod info (name, status, restarts, node)
kubectl get pods -o wide

# Events sorted by time (most recent first)
kubectl get events --sort-by='.lastTimestamp' | tail -20

# Find pods by image
kubectl get pods -o json | jq '.items[] | select(.spec.containers[0].image | contains("nginx")) | .metadata.name'

# Find pods using specific volume
kubectl get pods -o json | jq '.items[] | select(.spec.volumes[] | select(.configMap.name=="config-name")) | .metadata.name'

# All containers across all pods
kubectl get pods -A -o json | jq '.items[].spec.containers[].image' | sort | uniq
```

---

## Kubectl Configuration

```bash
# View kubeconfig
kubectl config view
kubectl config current-context

# Switch context
kubectl config use-context <context-name>

# List contexts
kubectl config get-contexts

# Set default namespace for context
kubectl config set-context --current --namespace=<namespace>

# Create new kubeconfig entry (for new cluster)
kubectl config set-cluster <cluster-name> --server=https://... --certificate-authority=...
kubectl config set-credentials <user> --token=...
kubectl config set-context <context> --cluster=<cluster> --user=<user>
```

---

## Performance Tips

```bash
# Avoid watching large clusters
kubectl get pods            # Fine
kubectl get pods -w         # OK for small clusters, can be slow

# Use field selectors instead of get-all + grep
# ❌ Slow
kubectl get pods -A | grep Running

# ✅ Fast
kubectl get pods -A --field-selector=status.phase=Running

# Limit context with namespace flags
# ❌ Slow (searches all namespaces)
kubectl get pods

# ✅ Fast (specific namespace)
kubectl get pods -n <namespace>

# Use custom columns to reduce data transfer
# ❌ Large output
kubectl get pods -o yaml

# ✅ Targeted output
kubectl get pods -o custom-columns=NAME:.metadata.name,STATUS:.status.phase
```
