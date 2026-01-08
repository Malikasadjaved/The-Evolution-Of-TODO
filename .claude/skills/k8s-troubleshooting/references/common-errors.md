# Common Kubernetes Errors & Solutions

## Pod Status Errors

| Error | Meaning | Cause | Solution |
|-------|---------|-------|----------|
| **ImagePullBackOff** | Cannot pull container image | Image doesn't exist, tag wrong, registry unreachable, credentials missing | Verify image exists locally: `docker pull <image>`; Check ImagePullSecret; Verify registry access |
| **CrashLoopBackOff** | Container starts then crashes | App startup error, missing dependencies, config issues | Check logs: `kubectl logs <pod> --previous`; Check init containers; Verify dependencies running |
| **Pending** | Pod waiting to schedule | No resources available, node selector mismatch, taints | Check events: `kubectl describe pod`; Verify resources available; Check node labels/taints |
| **OOMKilled** | Memory limit exceeded | Memory limit too low, memory leak | Increase memory limit; Check for leaks: `kubectl top pod`; Profile application |
| **Init:1/2** | Init container running | Dependency not ready, init container command failing | Check init logs: `kubectl logs <pod> -c <init>`; Verify dependencies; Increase timeout |
| **ContainerCreating** | Container starting | Normal transient state | Wait a few seconds; If stuck, check for resource issues |
| **Error** | Pod failed to start | Invalid config, image pull error | Check events and logs for specifics |

---

## Event Error Messages

### Image Pull Errors

```
Failed to pull image "nginx:latest": rpc error: code = Unknown desc = Error response from daemon: manifest not found
```
**Cause**: Image tag doesn't exist
**Fix**: `docker pull nginx:latest` to verify locally; push correct image

```
Failed to pull image "myregistry.azurecr.io/myapp:1.0": pulling image authentication required
```
**Cause**: Private registry credentials missing
**Fix**: Create ImagePullSecret; Add to pod spec

```
Failed to pull image "nginx:latest": dial tcp: lookup docker.io on [DNS]: no such host
```
**Cause**: Cannot reach registry (network/DNS issue)
**Fix**: Check network policies; Verify DNS resolution; Check firewall

---

### Scheduling Errors

```
0/3 nodes are available: 3 Insufficient cpu. Preemption is not helpful for scheduling.
```
**Cause**: No node has enough CPU
**Fix**: Increase cluster size; Reduce CPU requests; Check `kubectl top nodes`

```
0/3 nodes are available: 3 Insufficient memory. Preemption is not helpful for scheduling.
```
**Cause**: No node has enough memory
**Fix**: Add more nodes; Reduce memory requests; Check `kubectl describe node <node>`

```
0/3 nodes are available: 3 node(s) had no available volume zone labels.
```
**Cause**: Node missing zone labels (PersistentVolume zone constraint)
**Fix**: Label nodes with `zone` or `topology.kubernetes.io/zone`

```
0/1 nodes are available: 1 node has .+taints that the pod does not tolerate
```
**Cause**: Node has taints pod doesn't tolerate
**Fix**: Add tolerations to pod; Remove taint from node; Change nodeSelector

```
error when creating pod: exceeded quota
```
**Cause**: Namespace resource quota exceeded
**Fix**: Check quota: `kubectl describe resourcequota -n <ns>`; Delete/scale down pods; Request quota increase

---

### Network Errors

```
Connection refused
```
**Cause**: Service not accepting connections on that port
**Fix**: Verify container listening: `kubectl exec <pod> -- netstat -tlnp`; Check targetPort; Verify app started

```
Name or service not known
```
**Cause**: DNS resolution failed
**Fix**: Test DNS: `kubectl run -it debug --image=busybox -- nslookup <svc>`; Restart CoreDNS; Check /etc/resolv.conf

```
Operation timed out
```
**Cause**: Network unreachable; Firewall blocking; Service endpoint missing
**Fix**: Test connectivity: `kubectl port-forward`; Check network policies; Verify endpoints exist

```
Destination unreachable
```
**Cause**: Pod network misconfigured; CNI plugin issue
**Fix**: Check pod IPs: `kubectl get pods -o wide`; Verify CNI plugin running; Check network policies

---

### Container Runtime Errors

```
CrashLoopBackOff: Exit code: 1
```
**Cause**: Application crashed on startup
**Fix**: Check logs: `kubectl logs <pod> --previous`; Verify config files; Check dependencies

```
CrashLoopBackOff: Exit code: 137 (0x89)
```
**Cause**: Process killed (likely OOM or SIGKILL)
**Fix**: Check: `kubectl describe pod` → look for OOMKilled; Increase memory limit

```
CrashLoopBackOff: Exit code: 139 (0x8b)
```
**Cause**: Segmentation fault (memory corruption or invalid memory access)
**Fix**: Check application code; Rebuild image; Try different base image

```
CreateContainerError: invalid mount path "/" is not absolute
```
**Cause**: Volume mount path invalid
**Fix**: Fix volume mount in pod spec; Ensure path is absolute (starts with /)

---

### Resource Errors

```
OOMKilled
```
**Cause**: Container exceeded memory limit
**Fix**: Increase limit: `kubectl set resources deployment/<dep> --limits=memory=1Gi`; Check for leaks

```
Evicted: The node was low on resource: memory
```
**Cause**: Node memory pressure; Pod evicted
**Fix**: Add more nodes; Reduce pod density; Increase node memory; Set resource requests/limits

```
Evicted: The node was low on resource: ephemeral-storage
```
**Cause**: /tmp or ephemeral storage full
**Fix**: Check disk usage: `kubectl exec <pod> -- df -h`; Clear temp files; Increase volume size

---

### Init Container Errors

```
Init:Error
```
**Cause**: Init container exited with non-zero code
**Fix**: Check logs: `kubectl logs <pod> -c <init-container>`; Fix command; Verify dependencies

```
Init:CrashLoopBackOff
```
**Cause**: Init container keeps crashing
**Fix**: Same as CrashLoopBackOff; Also check: is init waiting for dependency?

```
timeout waiting for init container
```
**Cause**: Init container takes too long
**Fix**: Increase timeout: `spec.initContainers[].terminationMessagePath`; Optimize init script

---

### Permission/RBAC Errors

```
error: You must be logged in to the server (Unauthorized)
```
**Cause**: Authentication failed
**Fix**: Check kubeconfig; Verify credentials; Re-authenticate

```
Error from server (Forbidden): ... is forbidden
```
**Cause**: RBAC permission denied
**Fix**: Check role: `kubectl auth can-i get pods`; Update ClusterRole/Role; Request permissions

```
ConfigMap "<name>" not found
```
**Cause**: ConfigMap doesn't exist in namespace
**Fix**: Create ConfigMap: `kubectl create configmap <name> --from-literal=key=value`

---

### Storage Errors

```
error attaching volume: failed to attach volume
```
**Cause**: PersistentVolume attachment failed
**Fix**: Check PV status; Verify volume exists; Check node limits (too many volumes)

```
Pod does not have write permissions to mount at /data
```
**Cause**: Pod security context or volume permissions
**Fix**: Check pod `securityContext`; Verify PVC has RWX access mode; Fix volume permissions

```
no persistent volumes available for this claim and kind: Pending
```
**Cause**: No matching PersistentVolume for PersistentVolumeClaim
**Fix**: Create PV; Match accessMode and storage class; Check storage provisioner

---

## Debugging Techniques

### Capturing Error Context

```bash
# Get all pod information at time of failure
kubectl describe pod <pod-name> > pod-debug.txt

# Get logs with timestamps
kubectl logs <pod-name> --timestamps=true > logs.txt

# Export pod definition for analysis
kubectl get pod <pod-name> -o yaml > pod-spec.yaml

# Get node info where pod was running
NODE=$(kubectl get pod <pod-name> -o jsonpath='{.spec.nodeName}')
kubectl describe node $NODE > node-debug.txt

# Get all events in cluster
kubectl get events -A --sort-by='.lastTimestamp' > events.txt

# Resource snapshot
kubectl top pods > pods-resources.txt
kubectl top nodes > nodes-resources.txt
```

### Reproducing Issues

```bash
# Run similar pod to test image
kubectl run test --image=<image-name> --restart=Never
kubectl logs test
kubectl delete pod test

# Test connectivity from pod
kubectl run -it --rm debug --image=<app-image> -- /bin/bash
# Inside: curl http://<service>:port

# Simulate resource pressure
kubectl run stress --image=polinux/stress -- stress --vm 1 --vm-bytes 250M --vm-hang 60

# Test with different resource limits
kubectl patch deployment <dep> -p '{"spec":{"template":{"spec":{"containers":[{"name":"<container>","resources":{"limits":{"memory":"1Gi"}}}]}}}}'
```

---

## Prevention Patterns

### Health Probes

```yaml
# Good: Liveness probe prevents stuck containers
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 30      # Give app time to start
  periodSeconds: 10            # Check every 10 seconds
  failureThreshold: 3          # Kill after 3 failures (30s)

# Good: Readiness probe prevents routing to unready pods
readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 5
  failureThreshold: 3
```

### Resource Management

```yaml
# Good: Set both requests and limits
resources:
  requests:
    cpu: "250m"          # Guaranteed resources for scheduling
    memory: "256Mi"
  limits:
    cpu: "500m"          # Maximum allowed
    memory: "512Mi"

# Bad: Only limits (scheduler can't guarantee resources)
resources:
  limits:
    cpu: "500m"
    memory: "512Mi"

# Bad: Limits lower than requests (invalid)
resources:
  requests:
    cpu: "500m"
  limits:
    cpu: "250m"  # ❌ Invalid!
```

### Init Container Pattern

```yaml
# Good: Wait for dependencies before starting main container
initContainers:
- name: wait-for-db
  image: busybox:1.35
  command: ['sh', '-c']
  args:
  - |
    echo "Waiting for database..."
    until nc -z postgres-db 5432; do
      sleep 2
    done
    echo "Database ready!"

containers:
- name: app
  image: myapp:1.0
  # App starts only after init succeeds
```

### Network Policy Pattern

```yaml
# Good: Allow specific traffic
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: app-network
spec:
  podSelector:
    matchLabels:
      app: myapp
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: default
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 443
```

---

## Monitoring & Alerting

### Key Metrics to Monitor

```bash
# Pod restart count
kubectl get pods -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.containerStatuses[0].restartCount}{"\n"}{end}'

# OOMKilled events
kubectl get events --field-selector reason=OOMKilled

# Failed pod creation
kubectl get events --field-selector reason=Failed

# Pending pods
kubectl get pods --field-selector=status.phase=Pending

# High memory usage
kubectl top pods | awk '$2 > 400 {print}'  # >400Mi

# High CPU usage
kubectl top pods | awk '$3 > 500 {print}'  # >500m
```

### Prometheus Queries for Alerting

```
# Alert: Pod OOMKilled
increase(kube_pod_container_status_terminated_reason{reason="OOMKilled"}[5m]) > 0

# Alert: Pod CrashLooping
increase(kube_pod_container_status_restarts_total[5m]) > 5

# Alert: CPU throttling
rate(container_cpu_cfs_throttled_seconds_total[5m]) > 0.1

# Alert: Memory pressure
kube_node_labels{label_node_kubernetes_io_memory_pressure="true"} == 1
```
