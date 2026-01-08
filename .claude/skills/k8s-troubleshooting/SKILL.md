---
name: k8s-troubleshooting
description: |
  This skill should be used when debugging Kubernetes issues in any environment (Minikube, local, cloud).
  Provides real-time diagnostic workflows and reusable runbooks for 8 common scenarios: ImagePullBackOff,
  CrashLoopBackOff, OOMKilled, Pending pods, networking failures, performance issues, init container
  failures, and resource constraints. Includes kubectl command patterns, root cause analysis, and
  step-by-step remediation procedures.
allowed-tools: Read, Grep, Glob, Bash
---

# Kubernetes Troubleshooting Skill

> **Troubleshooting Framework**: Diagnose → Root Cause Analysis → Remediation → Prevention

## Before Implementation

Gather context to ensure successful troubleshooting:

| Source | Gather |
|--------|--------|
| **Cluster State** | `kubectl get nodes`, `kubectl get pods`, current resource usage |
| **Issue Description** | What service is affected? When did it start? Any recent changes? |
| **Logs & Events** | Pod events, container logs, system logs if available |
| **Skill References** | Domain patterns from `references/` (diagnostic workflows, kubectl patterns) |

---

## Quick Diagnostic Workflow (Start Here)

When you encounter an issue, run this 7-step diagnostic:

```bash
# Step 1: Check pod status and events (most info here)
kubectl describe pod <pod-name>

# Step 2: Review container logs (recent failures)
kubectl logs <pod-name> --tail=100
kubectl logs <pod-name> --previous 2>/dev/null || echo "No previous logs"

# Step 3: Check node and resource status (capacity issues)
kubectl top pod <pod-name>
kubectl top nodes

# Step 4: Verify related services/endpoints (connectivity)
kubectl get svc,endpoints -l app=<app-name>

# Step 5: Check resource requests/limits (performance issues)
kubectl get pod <pod-name> -o yaml | grep -A 5 resources:

# Step 6: Get cluster events (infrastructure issues)
kubectl get events --sort-by='.lastTimestamp' | tail -20

# Step 7: If needed, create debug container (deep inspection)
kubectl run -it --rm debug --image=busybox:1.35 -- sh
```

**Output**: From this workflow, identify which scenario below matches your issue.

---

## Scenario 1: ImagePullBackOff (Image Pull Failures)

**Symptoms**: Pod stuck in `ImagePullBackOff` state; pulling image fails with registry errors.

### Diagnosis (Kubectl Commands)

```bash
# Show pod status and failure details
kubectl describe pod <pod-name>
# Look for: "State: Waiting, Reason: ImagePullBackOff"
# Look for: "Failed to pull image" in Events section

# Get pod YAML for image configuration
kubectl get pod <pod-name> -o yaml | grep -A 5 image:

# Check image pull secrets
kubectl get pod <pod-name> -o yaml | grep -A 3 imagePullSecrets
```

### Root Cause Analysis (Decision Tree)

1. **Is the image URL correct?**
   - Check: `kubectl describe pod <pod-name>` → Image field
   - Fix: Correct typo in deployment spec, redeploy

2. **Does the image tag exist in registry?**
   - Test: `docker pull <image>:<tag>` from your machine
   - Fix: Push correct image version or use existing tag

3. **For private registries: Are credentials configured?**
   - Check: `kubectl get secrets | grep docker`
   - Fix: Create ImagePullSecret (see remediation)

4. **Is the registry accessible from cluster nodes?**
   - Test: `kubectl run -it --rm debug --image=busybox -- nslookup <registry-domain>`
   - Fix: Check network policies, firewall rules

### Remediation (Step-by-Step)

```bash
# 1. Test image availability locally
docker pull nginx:1.21
# If fails: wrong tag or inaccessible registry

# 2. For private registries, create credentials secret
kubectl create secret docker-registry regcred \
  --docker-server=<registry-url> \
  --docker-username=<username> \
  --docker-password=<password> \
  --docker-email=<email>

# 3. Reference secret in deployment spec
kubectl patch deployment <deployment-name> \
  -p '{"spec":{"template":{"spec":{"imagePullSecrets":[{"name":"regcred"}]}}}}'

# 4. Update image reference in deployment
kubectl set image deployment/<deployment-name> \
  <container-name>=<correct-image>:<tag>

# 5. Trigger rollout (pod will retry image pull)
kubectl rollout restart deployment <deployment-name>

# 6. Monitor progress
kubectl get pods -w
kubectl describe pod <pod-name>
```

---

## Scenario 2: CrashLoopBackOff (Container Crashes)

**Symptoms**: Pod restarts repeatedly; exit code non-zero; application crashes on startup.

### Diagnosis (Kubectl Commands)

```bash
# Show pod status with restart count
kubectl get pod <pod-name>
# Look for: "RESTARTS: 5+" indicates repeated crashes

# Get detailed status including termination reason
kubectl describe pod <pod-name>
# Look for: "Last State: Terminated (ExitCode: 1)"

# View container logs (last execution)
kubectl logs <pod-name> --tail=50

# View logs from previous crashed container
kubectl logs <pod-name> --previous

# Get termination message (application error info)
kubectl get pod <pod-name> -o go-template='{{range .status.containerStatuses}}{{.name}}: {{.state.terminated.message}}{{end}}'

# For multi-container pods, specify container
kubectl logs <pod-name> -c <container-name> --tail=50
```

### Root Cause Analysis (Decision Tree)

1. **Is the application crashing on startup?**
   - Check: `kubectl logs <pod-name> --previous` → first 10 lines
   - Common: Config file missing, env var undefined, syntax error
   - Fix: Add init containers or fix startup script

2. **Are dependencies available?**
   - Test: Can application reach database? Message queue?
   - Check: `kubectl logs <pod-name>` → connection errors?
   - Fix: Use init containers to wait for dependencies

3. **Are resource limits too low?**
   - Check: `kubectl top pod <pod-name>` vs `limits` in spec
   - Fix: Increase memory/CPU limits

4. **Is the container image corrupt?**
   - Test: `docker run <image> /bin/bash` locally
   - Fix: Rebuild and re-push image

### Remediation (Step-by-Step)

```bash
# 1. Capture detailed error information
kubectl logs <pod-name> --previous --timestamps=true

# 2. If debugging needed, exec into pod (if not crashing immediately)
kubectl exec -it <pod-name> -- /bin/bash
# Inside container:
# - Check env vars: env | grep -i config
# - Check config files: ls -la /etc/config/
# - Try running command manually

# 3. Add init container to wait for dependencies
kubectl patch deployment <deployment-name> -p '{"spec":{"template":{"spec":{"initContainers":[{"name":"wait-for-db","image":"busybox:1.35","command":["sh","-c","until nc -z db-service 5432; do sleep 2; done"]}]}}}}'

# 4. Increase resource limits if OOM suspected
kubectl set resources deployment <deployment-name> \
  --limits=memory=1Gi,cpu=1000m

# 5. Restart pods to see new behavior
kubectl rollout restart deployment <deployment-name>

# 6. Monitor logs in real-time
kubectl logs -f <pod-name>
```

---

## Scenario 3: OOMKilled (Memory Exceeded)

**Symptoms**: Pod killed due to out-of-memory; `Status: OOMKilled`; memory limit exceeded.

### Diagnosis (Kubectl Commands)

```bash
# Check termination status (OOMKilled)
kubectl describe pod <pod-name>
# Look for: "Last State: Terminated (Reason: OOMKilled)"

# View current memory usage (requires metrics-server)
kubectl top pod <pod-name>
kubectl top pod <pod-name> --containers

# Get resource limits
kubectl get pod <pod-name> -o yaml | grep -B 5 -A 5 limits:

# Check node memory pressure
kubectl describe node <node-name> | grep -i "memory\|pressure"

# View previous container logs (before OOM killed it)
kubectl logs <pod-name> --previous
```

### Root Cause Analysis (Decision Tree)

1. **Is memory limit too low?**
   - Check: Current usage (`kubectl top pod`) vs limit in spec
   - Common: Limit set to 256Mi but app needs 512Mi+
   - Fix: Increase limit based on profiling

2. **Is there a memory leak in application?**
   - Pattern: Memory usage grows until OOMKilled; quick restart cycle
   - Fix: Debug application (check for unbounded allocations)

3. **Are too many pods on the node?**
   - Check: `kubectl top nodes` → total memory used
   - Fix: Add more nodes or reduce replica count

4. **Is caching or buffering unbounded?**
   - Check: Application code for unlimited cache growth
   - Fix: Implement cache eviction or bounds

### Remediation (Step-by-Step)

```bash
# 1. Get current memory usage
kubectl top pod <pod-name> --containers

# 2. Check current limit
kubectl get pod <pod-name> -o yaml | grep -A 2 "limits:"

# 3. Increase memory limit in deployment
kubectl set resources deployment <deployment-name> \
  --limits=memory=1Gi

# 4. Set request too (to guarantee resources)
kubectl set resources deployment <deployment-name> \
  --requests=memory=512Mi,cpu=250m \
  --limits=memory=1Gi,cpu=500m

# 5. Trigger rolling update
kubectl rollout restart deployment <deployment-name>

# 6. Monitor new pod's memory usage
kubectl top pod <pod-name> --containers --watch

# 7. If still OOMKilled, debug application
kubectl exec -it <pod-name> -- /bin/bash
# Check: ps aux (process list), free -h (memory), top (live monitoring)
```

---

## Scenario 4: Pending Pods (Scheduling Issues)

**Symptoms**: Pod stuck in `Pending` state; never gets scheduled to nodes; `FailedScheduling` events.

### Diagnosis (Kubectl Commands)

```bash
# Show pod status (Pending phase)
kubectl get pod <pod-name>
kubectl get pod <pod-name> -o wide  # See Node column

# Get detailed status and scheduling events
kubectl describe pod <pod-name>
# Look for: "Events" section → "FailedScheduling"

# Get all pending pods
kubectl get pods --field-selector=status.phase=Pending

# Check node capacity
kubectl describe node <node-name>
# Look for: "Allocated resources", pressure conditions

# Check node selector labels (if applied)
kubectl get pod <pod-name> -o yaml | grep -A 5 nodeSelector

# Check taints and tolerations
kubectl get nodes -o custom-columns=NAME:.metadata.name,TAINTS:.spec.taints
```

### Root Cause Analysis (Decision Tree)

1. **Are there enough resources on nodes?**
   - Check: `kubectl top nodes` → available CPU/memory
   - Common: Requests exceed available capacity
   - Fix: Add nodes or reduce requests

2. **Does node selector match any nodes?**
   - Check: Pod's `nodeSelector` labels vs node labels
   - Test: `kubectl get nodes --show-labels`
   - Fix: Update pod selector or add labels to nodes

3. **Are nodes tainted?**
   - Check: `kubectl describe node <node-name>` → Taints
   - Common: Maintenance taints, GPU node taints
   - Fix: Add tolerations to pod spec

4. **Is node in NotReady state?**
   - Check: `kubectl get nodes` → Status column
   - Fix: Investigate node issues, may need to drain/restart node

### Remediation (Step-by-Step)

```bash
# 1. Check scheduling failure reason
kubectl describe pod <pod-name> | grep -A 10 "Events:"

# 2. Check available node resources
kubectl top nodes
kubectl describe node <node-name> | grep -A 15 "Allocated resources"

# 3. If insufficient resources, scale node pool
kubectl scale nodes --replicas=3  # or use cloud provider CLI

# 4. If node selector mismatch, check labels
kubectl get nodes --show-labels
kubectl get pod <pod-name> -o yaml | grep nodeSelector

# 5. Add labels to node if needed
kubectl label node <node-name> disk=ssd

# 6. Update pod to tolerate node taints (if needed)
# In deployment spec, add:
spec:
  tolerations:
  - key: "dedicated"
    operator: "Equal"
    value: "gpu"
    effect: "NoSchedule"

# 7. Trigger redeployment
kubectl rollout restart deployment <deployment-name>

# 8. Monitor scheduling
kubectl get pods -w
```

---

## Scenario 5: Networking & DNS Issues

**Symptoms**: Pod can't reach service; DNS resolution fails; `Connection refused` errors.

### Diagnosis (Kubectl Commands)

```bash
# Check service exists and has endpoints
kubectl get svc <service-name>
kubectl get endpoints <service-name>
# Endpoints should show pod IPs if service selector matches pods

# Check service configuration
kubectl get svc <service-name> -o yaml

# Test DNS resolution from pod
kubectl run -it --rm debug --image=busybox:1.35 -- \
  nslookup <service-name>.default.svc.cluster.local

# Test connectivity to service
kubectl run -it --rm debug --image=busybox:1.35 -- \
  wget -qO- http://<service-name>:80 || echo "Failed to connect"

# Check if CoreDNS is running
kubectl get pods -n kube-system -l k8s-app=kube-dns

# View CoreDNS logs
kubectl logs -n kube-system -l k8s-app=kube-dns --tail=50

# Check pod's DNS config
kubectl exec -it <pod-name> -- cat /etc/resolv.conf

# Check network policies that might block traffic
kubectl get networkpolicies
```

### Root Cause Analysis (Decision Tree)

1. **Does the service exist?**
   - Check: `kubectl get svc <service-name>`
   - Fix: Create service or check service name spelling

2. **Do service endpoints exist?**
   - Check: `kubectl get endpoints <service-name>`
   - Common: Service selector labels don't match pod labels
   - Fix: Update service selector or pod labels

3. **Is the service port configuration correct?**
   - Check: Service port vs targetPort vs container port
   - Common: Mismatch between these three
   - Fix: Verify all three match in service spec

4. **Are network policies blocking traffic?**
   - Check: `kubectl get networkpolicies -o wide`
   - Test: Remove policy, retry connection
   - Fix: Update network policy ingress rules

5. **Is DNS not resolving?**
   - Test: `nslookup <service-name>` from debug pod
   - Common: CoreDNS pod crashed or not running
   - Fix: Restart CoreDNS

### Remediation (Step-by-Step)

```bash
# 1. Verify service and endpoints
kubectl get svc <service-name>
kubectl get endpoints <service-name>

# 2. Check service selector matches pod labels
kubectl get pods --selector=<label-key>=<label-value>
# Should match pods that should be endpoints

# 3. Fix selector mismatch (if needed)
kubectl patch svc <service-name> -p \
  '{"spec":{"selector":{"app":"<app-name>"}}}'

# 4. Verify port configuration
kubectl get svc <service-name> -o yaml | grep -A 10 "ports:"
# port: (ClusterIP listening port)
# targetPort: (container port to forward to)

# 5. Fix port mismatch (if needed)
kubectl patch svc <service-name> -p \
  '{"spec":{"ports":[{"port":80,"targetPort":8080}]}}'

# 6. Check network policies
kubectl get networkpolicies
kubectl describe networkpolicy <policy-name>

# 7. Temporarily disable network policy to test
kubectl delete networkpolicy <policy-name>
# If connectivity works, update policy ingress rules

# 8. Verify CoreDNS health
kubectl get pods -n kube-system -l k8s-app=kube-dns
kubectl logs -n kube-system -l k8s-app=kube-dns --tail=20

# 9. Restart CoreDNS if needed
kubectl rollout restart deployment/coredns -n kube-system

# 10. Test from debug pod
kubectl run -it --rm debug --image=busybox:1.35 -- \
  nslookup <service-name>.default.svc.cluster.local
```

---

## Scenario 6: Performance Issues (CPU Throttling, Slow Responses)

**Symptoms**: Application slow; pods restarted frequently; high latency; CPU/memory usage at limits.

### Diagnosis (Kubectl Commands)

```bash
# View resource usage vs limits
kubectl top pod <pod-name> --containers
# Compare to: kubectl get pod <pod-name> -o yaml | grep -A 5 limits:

# Check node resource pressure
kubectl describe node <node-name> | grep -E "(pressure|Pressure)"

# Monitor real-time resource usage
kubectl top pods --watch

# Check for pod evictions
kubectl get events --sort-by='.lastTimestamp' | grep Evicted

# Get resource requests for all pods (to see if sum exceeds node capacity)
kubectl get pods -o custom-columns=NAME:.metadata.name,CPU-REQ:.spec.containers[0].resources.requests.cpu,MEM-REQ:.spec.containers[0].resources.requests.memory

# Check for horizontal pod autoscaler (HPA)
kubectl get hpa
kubectl describe hpa <hpa-name>
```

### Root Cause Analysis (Decision Tree)

1. **Is CPU throttled by limits?**
   - Check: `kubectl top pod` (current CPU) vs limit in spec
   - Pattern: Current CPU near limit continuously
   - Fix: Increase CPU limit or optimize code

2. **Is memory usage near limit?**
   - Check: `kubectl top pod --containers` vs memory limit
   - Pattern: Frequent pod evictions due to memory pressure
   - Fix: Increase memory limit or fix memory leak

3. **Is node under resource pressure?**
   - Check: `kubectl describe node <node-name>` → Pressure conditions
   - Fix: Add more nodes or reduce pod density

4. **Is HPA scaling insufficient?**
   - Check: `kubectl get hpa` → Desired vs current replicas
   - Pattern: HPA maxReplicas reached, pods still overloaded
   - Fix: Increase HPA limits or optimize per-pod capacity

### Remediation (Step-by-Step)

```bash
# 1. Check current resource usage
kubectl top pod <pod-name> --containers
kubectl top nodes

# 2. Check resource limits in deployment
kubectl get pod <pod-name> -o yaml | grep -A 7 "resources:"

# 3. Increase CPU limit (if throttled)
kubectl set resources deployment <deployment-name> \
  --limits=cpu=2000m

# 4. Increase memory limit (if memory-constrained)
kubectl set resources deployment <deployment-name> \
  --limits=memory=2Gi

# 5. Also set requests (scheduling guarantee)
kubectl set resources deployment <deployment-name> \
  --requests=cpu=500m,memory=512Mi \
  --limits=cpu=2000m,memory=2Gi

# 6. Trigger rolling update
kubectl rollout restart deployment <deployment-name>

# 7. If node-level pressure, add more nodes
kubectl scale nodepool <pool-name> --replicas=5

# 8. Configure or update HPA
kubectl autoscale deployment <deployment-name> --min=2 --max=10 --cpu-percent=70

# 9. Monitor HPA status
kubectl get hpa
kubectl describe hpa <hpa-name>

# 10. Check if optimization needed (may need code changes)
kubectl exec -it <pod-name> -- /bin/bash
# Inside: top (live CPU/memory), ps aux (process analysis)
```

---

## Scenario 7: Init Container Failures

**Symptoms**: Pod stuck in `Init` state (e.g., `Init:1/2`); init container logs show errors.

### Diagnosis (Kubectl Commands)

```bash
# Check pod status showing init container progress
kubectl get pod <pod-name>
# Look for: "Init:1/2" (1 of 2 init containers completed)

# Get detailed init container info
kubectl describe pod <pod-name>
# Look for: "initContainerStatuses" section

# View init container logs
kubectl logs <pod-name> -c <init-container-name>

# Get exit code if init container failed
kubectl get pod <pod-name> -o go-template='{{range .status.initContainerStatuses}}{{.name}}: {{.state.terminated.exitCode}}{{end}}'

# Check full pod spec for init container config
kubectl get pod <pod-name> -o yaml | grep -A 20 "initContainers:"
```

### Root Cause Analysis (Decision Tree)

1. **Did init container command fail (exit code != 0)?**
   - Check: `kubectl logs <pod-name> -c <init-container-name>`
   - Common: Script syntax error, command not found
   - Fix: Fix init container command or image

2. **Is init container waiting for dependency?**
   - Check: Logs for "waiting for..." messages
   - Common: Database not up, service not available
   - Fix: Verify dependency is running before retry

3. **Is init container volume mount missing?**
   - Check: Logs for "no such file or directory"
   - Fix: Verify volume exists and init container spec references it

4. **Are init container resources exhausted?**
   - Check: `kubectl describe pod` → init container resource requests
   - Fix: Increase limits or reduce resource requests

### Remediation (Step-by-Step)

```bash
# 1. Check init container status and logs
kubectl describe pod <pod-name>
kubectl logs <pod-name> -c <init-container-name> --tail=50

# 2. Common fix: Wait for database pattern
# Update deployment with init container:
spec:
  initContainers:
  - name: wait-for-db
    image: busybox:1.35
    command: ['sh', '-c', "until nc -z postgres-service 5432; do echo 'Waiting for database...'; sleep 5; done"]

# 3. If dependency not ready, verify it's running
kubectl get pod -l app=postgres

# 4. Check if init container has correct permissions
kubectl exec <pod-name> -c <init-container-name> -- ls -la /

# 5. Increase init container resource limits
kubectl patch deployment <deployment-name> -p \
  '{"spec":{"template":{"spec":{"initContainers":[{"name":"<init-name>","resources":{"limits":{"memory":"256Mi","cpu":"500m"}}}]}}}}'

# 6. Restart pods to retry init
kubectl rollout restart deployment <deployment-name>

# 7. Monitor init container progress
kubectl get pods -w
kubectl logs -f <pod-name> -c <init-container-name>
```

---

## Scenario 8: Resource Constraints (Requests/Limits Misconfiguration)

**Symptoms**: Pods can't be scheduled; resource conflicts; unpredictable pod behavior.

### Diagnosis (Kubectl Commands)

```bash
# Check pod resource configuration
kubectl get pod <pod-name> -o yaml | grep -A 7 "resources:"

# View resource requests for all pods in namespace
kubectl get pods -o custom-columns=NAME:.metadata.name,CPU-REQ:.spec.containers[0].resources.requests.cpu,MEM-REQ:.spec.containers[0].resources.requests.memory,CPU-LIM:.spec.containers[0].resources.limits.cpu,MEM-LIM:.spec.containers[0].resources.limits.memory

# Check node resource availability
kubectl top nodes
kubectl describe node <node-name> | grep -A 20 "Allocated resources"

# Calculate if pod fits on any node
kubectl get nodes -o wide
# Calculate: Pod requests < (Node allocatable - Currently allocated)
```

### Root Cause Analysis (Decision Tree)

1. **Are requests too high?**
   - Common: Requests exceed available node capacity
   - Fix: Profile application to find realistic requests

2. **Are limits lower than requests?**
   - Check: limits < requests (invalid configuration)
   - Fix: Set limits >= requests

3. **Are requests missing entirely?**
   - Check: Pod spec has no `resources.requests` section
   - Impact: Scheduler can't guarantee resources
   - Fix: Add requests based on profiling

4. **Do limits differ between environments?**
   - Common: Dev limits too low for production workload
   - Fix: Use environment-specific values files

### Remediation (Step-by-Step)

```bash
# 1. Check current resource configuration
kubectl get pod <pod-name> -o yaml | grep -B 2 -A 10 "resources:"

# 2. Profile application to determine realistic requirements
kubectl top pod <pod-name> --containers --watch
# Run for 5-10 minutes under typical load
# Note: 95th percentile values for limits

# 3. Set resource requests and limits
kubectl set resources deployment <deployment-name> \
  --requests=cpu=250m,memory=256Mi \
  --limits=cpu=500m,memory=512Mi

# 4. Verify requests don't exceed node capacity
kubectl top nodes
# Total requests should be <70% of node capacity per constitution

# 5. Trigger rolling update
kubectl rollout restart deployment <deployment-name>

# 6. Monitor pod scheduling
kubectl get pods -w

# 7. If pods still pending, check for resource exhaustion
kubectl describe pod <pod-name> | grep "FailedScheduling"

# 8. Scale out if needed
kubectl scale deployment <deployment-name> --replicas=1  # Start smaller
```

---

## Prevention Best Practices

### 1. Resource Management
- Always set both **requests** (scheduling) and **limits** (enforcement)
- Profile applications under realistic load before setting limits
- Keep total requests <70% of node capacity (allows for spikes)

### 2. Health Probes
- Configure **liveness probes** (restart unhealthy pods)
- Configure **readiness probes** (remove from load balancing)
- Use appropriate probe delays and thresholds

### 3. Monitoring & Observability
- Deploy metrics-server for `kubectl top` visibility
- Use Prometheus/Grafana for long-term metrics
- Monitor pod restart counts and eviction events
- Set up alerts for resource pressure

### 4. Deployment Strategy
- Use rolling updates (not `RollingUpdate` strategy but configure it)
- Test changes in staging environment first
- Keep deployment history for rollback capability
- Implement smoke tests post-deployment

### 5. Networking
- Use fully qualified domain names (FQDN) for service discovery
- Implement network policies gradually with testing
- Monitor CoreDNS pod health
- Test connectivity before declaring service healthy

### 6. Troubleshooting Workflow
- Always start with `kubectl describe pod` (most comprehensive)
- Check logs before modifying deployment
- Make one change at a time
- Document what you tried and what worked

---

## Reference: Kubectl Commands Summary

| Task | Command |
|------|---------|
| Describe pod | `kubectl describe pod <pod-name>` |
| View logs | `kubectl logs <pod-name> [-c container]` |
| Previous logs | `kubectl logs <pod-name> --previous` |
| Real-time logs | `kubectl logs -f <pod-name>` |
| Exec into pod | `kubectl exec -it <pod-name> -- /bin/bash` |
| Port forward | `kubectl port-forward svc/<svc-name> 8000:8000` |
| Resource usage | `kubectl top pod/node [<name>]` |
| Get pod YAML | `kubectl get pod <pod-name> -o yaml` |
| Set image | `kubectl set image deployment/<dep> container=image:tag` |
| Set resources | `kubectl set resources deployment/<dep> --requests=cpu=100m --limits=cpu=200m` |
| Rollout restart | `kubectl rollout restart deployment <deployment-name>` |
| Rollout rollback | `kubectl rollout rollback deployment <deployment-name>` |
| Get events | `kubectl get events --sort-by='.lastTimestamp'` |
| Debug pod | `kubectl run -it --rm debug --image=busybox:1.35 -- sh` |

---

## References

See `references/` directory for:
- `diagnostic-workflows.md` - Detailed decision trees for each scenario
- `kubectl-patterns.md` - kubectl command patterns and shortcuts
- `common-errors.md` - Error messages and causes
- `kubernetes-docs-links.md` - Official Kubernetes documentation
