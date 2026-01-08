# Kubernetes Diagnostic Workflows

## Decision Tree: "Pod not running, what's wrong?"

```
START: kubectl describe pod <pod-name>
  │
  ├─ Phase: "ImagePullBackOff"?
  │  └─ → See "ImagePullBackOff Diagnosis" below
  │
  ├─ Phase: "CrashLoopBackOff"?
  │  └─ → See "CrashLoopBackOff Diagnosis" below
  │
  ├─ Phase: "Pending"?
  │  └─ → See "Pending Pod Diagnosis" below
  │
  ├─ State: "Waiting (OOMKilled)"?
  │  └─ → See "OOMKilled Diagnosis" below
  │
  ├─ State: "Init:1/2" (Init container running)?
  │  └─ → See "Init Container Diagnosis" below
  │
  ├─ Phase: "Running" but pod is slow?
  │  └─ → See "Performance Issues Diagnosis" below
  │
  └─ Cannot determine phase?
     └─ → Check: kubectl get events --sort-by='.lastTimestamp'
```

---

## ImagePullBackOff Diagnosis

```
kubectl describe pod <pod-name>
  │
  ├─ Q: Is "Image" field correct?
  │  ├─ No → Fix typo in deployment spec
  │  └─ Yes → Continue
  │
  ├─ Q: Does image:tag exist in registry?
  │  ├─ No → docker pull <image>:<tag> fails → Push correct image
  │  └─ Yes → Continue
  │
  ├─ Q: Is this a private registry?
  │  ├─ Yes → Check: kubectl get secrets | grep docker
  │  │        Missing? → Create ImagePullSecret
  │  │        Exists? → Verify in pod spec: imagePullSecrets
  │  └─ No → Check network connectivity
  │
  └─ Q: Can cluster nodes reach registry?
     ├─ No → Check firewall, DNS, network policies
     └─ Yes → Verify image compatibility with node OS
```

### Quick Remediation
```bash
# Test image pull locally
docker pull <image>:<tag>

# For private registries
kubectl create secret docker-registry regcred \
  --docker-server=<registry-url> \
  --docker-username=<username> \
  --docker-password=<password>

# Update deployment
kubectl patch deployment <deployment-name> \
  -p '{"spec":{"template":{"spec":{"imagePullSecrets":[{"name":"regcred"}]}}}}'

# Trigger retry
kubectl rollout restart deployment <deployment-name>
```

---

## CrashLoopBackOff Diagnosis

```
kubectl describe pod <pod-name>
  │
  ├─ Q: What's the exit code? (Look: "Last State: Terminated")
  │  ├─ Exit 1, 2, 127 → Application crashed on startup
  │  │  └─ kubectl logs <pod-name> --previous → Find error
  │  │
  │  ├─ Exit 137 → Process killed (OOM or SIGKILL)
  │  │  └─ kubectl top pod <pod-name> vs limits → Increase limits
  │  │
  │  └─ Exit 139 → Segmentation fault
  │     └─ Likely app bug or memory corruption
  │
  ├─ Q: Are dependencies available? (Database, cache, message queue)
  │  ├─ No → kubectl logs <pod-name> --previous → "Connection refused"?
  │  │        → Add init container to wait for dependencies
  │  └─ Yes → Continue
  │
  ├─ Q: Is configuration/env correct?
  │  ├─ No → kubectl exec -it <pod-name> -- env | grep CONFIG
  │  │        → Fix ConfigMap or Secret
  │  └─ Yes → Continue
  │
  └─ Q: Is image/code broken?
     └─ docker run <image> /bin/bash locally
        → Test in dev environment
```

### Quick Remediation
```bash
# Capture error information
kubectl logs <pod-name> --previous --timestamps=true

# Check for OOM
kubectl describe pod <pod-name> | grep -i "oomkilled"

# Add dependency wait init container
kubectl patch deployment <deployment-name> \
  -p '{"spec":{"template":{"spec":{"initContainers":[{"name":"wait-for-db","image":"busybox:1.35","command":["sh","-c","until nc -z db-service 5432; do sleep 2; done"]}]}}}}'

# Increase resources if needed
kubectl set resources deployment <deployment-name> \
  --limits=memory=1Gi,cpu=1000m

# Restart
kubectl rollout restart deployment <deployment-name>
```

---

## Pending Pod Diagnosis

```
kubectl describe pod <pod-name>
  │
  ├─ Q: What does "Events" section say? (Look for "FailedScheduling")
  │  ├─ "Insufficient cpu" or "Insufficient memory"?
  │  │  ├─ No → Check: kubectl top nodes (are nodes full?)
  │  │  │        Yes → Add more nodes or scale down existing pods
  │  │  └─ Yes → Continue to next question
  │  │
  │  ├─ "No nodes match nodeSelector"?
  │  │  └─ kubectl get nodes --show-labels
  │  │     → Check if nodeSelector matches any node
  │  │     → Add labels to node or fix selector
  │  │
  │  └─ Other FailedScheduling reason?
  │     └─ kubectl get pod <pod-name> -o yaml → Examine full spec
  │
  ├─ Q: Are node selectors or affinity rules present?
  │  ├─ Yes → kubectl get pod <pod-name> -o yaml | grep -A 5 nodeSelector
  │  │        → Verify selector matches node labels
  │  └─ No → Continue
  │
  ├─ Q: Are all nodes in Ready state?
  │  ├─ No → kubectl describe node <node-name>
  │  │        → Fix node issues (network, disk, memory pressure)
  │  └─ Yes → Continue
  │
  └─ Q: Are taints preventing scheduling?
     └─ kubectl describe node <node-name> | grep Taints
        → Check pod tolerations vs node taints
        → Add tolerations if needed
```

### Quick Remediation
```bash
# Check scheduling events
kubectl describe pod <pod-name> | grep -A 5 "FailedScheduling"

# Check available resources
kubectl top nodes
kubectl describe node <node-name> | grep -A 15 "Allocated resources"

# Fix nodeSelector mismatch
kubectl get nodes --show-labels
kubectl label node <node-name> disk=ssd

# Add tolerations for taints
spec:
  tolerations:
  - key: "dedicated"
    operator: "Equal"
    value: "gpu"
    effect: "NoSchedule"

# Restart pod
kubectl delete pod <pod-name>
```

---

## OOMKilled Diagnosis

```
kubectl describe pod <pod-name>
  │
  ├─ Q: Does "Last State: Terminated" show "Reason: OOMKilled"?
  │  ├─ No → Not an OOM issue
  │  └─ Yes → Continue
  │
  ├─ Q: What are current memory limits?
  │  └─ kubectl get pod <pod-name> -o yaml | grep -A 5 "limits:"
  │     → Check if limit is too low for workload
  │
  ├─ Q: How much memory is the app actually using?
  │  └─ kubectl top pod <pod-name> --containers
  │     → Compare to limit
  │     → If usage grows until limit → Memory leak likely
  │
  ├─ Q: Are other pods on same node also OOMKilled?
  │  ├─ Yes → kubectl top nodes (node is under memory pressure)
  │  │        → Add more nodes or reduce pod density
  │  └─ No → This pod has specific memory issue
  │
  └─ Q: Is there a memory leak in the application?
     └─ Pattern: Memory usage grows until OOMKilled; quick restart cycle
        → Inspect application code for unbounded allocations
```

### Quick Remediation
```bash
# Check memory usage
kubectl top pod <pod-name> --containers

# Increase memory limit
kubectl set resources deployment <deployment-name> \
  --limits=memory=1Gi \
  --requests=memory=512Mi

# Trigger rolling update
kubectl rollout restart deployment <deployment-name>

# Monitor memory growth
kubectl top pod <pod-name> --containers --watch

# Debug if still happening
kubectl exec -it <pod-name> -- /bin/bash
# Inside: free -h (memory available), top (live monitoring)
```

---

## Init Container Failure Diagnosis

```
kubectl get pod <pod-name>
  │
  ├─ Status shows "Init:X/Y" (not Running or CrashLoopBackOff)
  │  └─ Continue → Init container still executing or failed
  │
  ├─ Q: Which init container is stuck?
  │  └─ kubectl describe pod <pod-name> | grep -A 10 "initContainerStatuses"
  │     → Shows which one failed/running
  │
  ├─ Q: What did the init container output?
  │  └─ kubectl logs <pod-name> -c <init-container-name>
  │     → Look for error messages
  │
  ├─ Q: Did init container complete successfully?
  │  ├─ Yes but still showing Init status?
  │  │  └─ Next init container failing (recursively apply logic)
  │  └─ No → Continue
  │
  ├─ Q: Is init container waiting for dependency?
  │  ├─ Yes → Verify dependency is running
  │  │        kubectl get pod -l app=<dependency>
  │  └─ No → Continue
  │
  ├─ Q: Are volumes mounted correctly?
  │  └─ kubectl describe pod <pod-name> | grep -A 5 "volumeMounts"
  │     → Verify volumes exist and have correct names
  │
  └─ Q: Does init container have required permissions?
     └─ kubectl exec <pod-name> -c <init-container-name> -- ls -la /
        → Check directory/file permissions
```

### Quick Remediation
```bash
# View init container logs
kubectl logs <pod-name> -c <init-container-name> --tail=50

# Common pattern: Wait for database
spec:
  initContainers:
  - name: wait-for-db
    image: busybox:1.35
    command: ['sh', '-c', "until nc -z postgres-service 5432; do sleep 5; done"]

# Verify dependency is running
kubectl get pod -l app=postgres

# Increase init container resource limits
kubectl patch deployment <deployment-name> \
  -p '{"spec":{"template":{"spec":{"initContainers":[{"name":"wait-for-db","resources":{"limits":{"memory":"256Mi","cpu":"500m"}}}]}}}}'

# Restart pods
kubectl rollout restart deployment <deployment-name>
```

---

## Networking Issue Diagnosis

```
kubectl run -it --rm debug --image=busybox:1.35 -- sh
  │
  ├─ Q: Can you resolve the service DNS?
  │  ├─ nslookup <service-name>
  │  ├─ nslookup <service-name>.default.svc.cluster.local
  │  │
  │  ├─ No → DNS resolution failure
  │  │        └─ Check: kubectl logs -n kube-system -l k8s-app=kube-dns
  │  │           → CoreDNS pod issues
  │  │
  │  └─ Yes → Continue
  │
  ├─ Q: Do service endpoints exist?
  │  ├─ kubectl get svc <service-name>
  │  ├─ kubectl get endpoints <service-name>
  │  │
  │  ├─ No endpoints → Service selector doesn't match pods
  │  │  └─ kubectl get pods -l <selector-label>
  │  │     → Verify pod labels match selector
  │  │
  │  └─ Yes → Continue
  │
  ├─ Q: Can you connect to the service?
  │  ├─ wget -qO- http://<service-name>:80
  │  │
  │  ├─ No → Connection refused
  │  │  └─ Check: Container is listening on targetPort?
  │  │     kubectl exec <pod-name> -- netstat -tlnp
  │  │
  │  └─ Yes → Service is working
  │
  └─ Q: If still no connection, check network policies
     └─ kubectl get networkpolicies
        → May be blocking ingress traffic
        → Temporarily delete to test
```

### Quick Remediation
```bash
# Test from debug pod
kubectl run -it --rm debug --image=busybox:1.35 -- nslookup <service-name>

# Check service and endpoints
kubectl get svc <service-name>
kubectl get endpoints <service-name>

# Fix selector mismatch
kubectl get pods --show-labels
kubectl patch svc <service-name> \
  -p '{"spec":{"selector":{"app":"<app-name>"}}}'

# Fix port mismatch
kubectl get svc <service-name> -o yaml | grep -A 10 "ports:"
kubectl patch svc <service-name> \
  -p '{"spec":{"ports":[{"port":80,"targetPort":8080}]}}'

# Check/restart CoreDNS
kubectl get pods -n kube-system -l k8s-app=kube-dns
kubectl rollout restart deployment/coredns -n kube-system
```

---

## Performance Issue Diagnosis

```
kubectl top pod <pod-name> --containers
  │
  ├─ Q: Is CPU at or near the limit?
  │  ├─ Yes → CPU throttling likely
  │  │        └─ Increase CPU limit or optimize code
  │  └─ No → Continue
  │
  ├─ Q: Is memory approaching limit?
  │  ├─ Yes → At risk of OOMKilled
  │  │        └─ Increase memory limit or fix leak
  │  └─ No → Continue
  │
  ├─ Q: Is the node under resource pressure?
  │  ├─ kubectl describe node <node-name> | grep "MemoryPressure\|DiskPressure"
  │  │
  │  ├─ Yes → kubectl top nodes (very high utilization)
  │  │        └─ Add more nodes or reduce pod density
  │  └─ No → Continue
  │
  ├─ Q: Are there multiple restarts? (RESTARTS column)
  │  ├─ Yes → Pod crashing and restarting
  │  │        └─ Check liveness probe configuration
  │  │           May be too aggressive
  │  └─ No → Continue
  │
  ├─ Q: How many pods can the node fit?
  │  └─ Calculate: Available resources / Pod requests
  │     → If only 1-2 pods fit, that's a constraint
  │
  └─ Q: Is HPA maxReplicas reached?
     └─ kubectl get hpa
        → If maxReplicas reached and CPU still high
        → Increase maxReplicas or scale horizontally
```

### Quick Remediation
```bash
# Check resource usage
kubectl top pod <pod-name> --containers
kubectl top nodes

# Increase resource limits
kubectl set resources deployment <deployment-name> \
  --requests=cpu=500m,memory=512Mi \
  --limits=cpu=2000m,memory=2Gi

# Restart pods
kubectl rollout restart deployment <deployment-name>

# Configure or update HPA
kubectl autoscale deployment <deployment-name> \
  --min=2 --max=10 --cpu-percent=70

# Monitor scaling
kubectl get hpa
kubectl describe hpa <hpa-name>
```

---

## Resource Constraint Diagnosis

```
kubectl get pods -o wide
  │
  ├─ Q: Are pods running on expected nodes?
  │  ├─ No → Scheduling issues
  │  │        └─ Check nodeSelector, affinity, taints/tolerations
  │  └─ Yes → Continue
  │
  ├─ Q: What are resource requests for all pods?
  │  └─ kubectl get pods -o custom-columns=NAME:.metadata.name,CPU-REQ:.spec.containers[0].resources.requests.cpu,MEM-REQ:.spec.containers[0].resources.requests.memory
  │
  ├─ Q: Do requests + limits make sense?
  │  ├─ Limits < Requests?
  │  │  └─ Invalid configuration (fix immediately)
  │  │
  │  ├─ Requests missing?
  │  │  └─ Scheduler has no guarantee for resource allocation
  │  │
  │  └─ Both present → Continue
  │
  ├─ Q: Can sum of requests fit on a node?
  │  ├─ No → Pods will never schedule
  │  │        └─ Reduce requests or add nodes
  │  └─ Yes → Continue
  │
  └─ Q: Do limits differ between dev/prod?
     └─ Use environment-specific values files
        → Helm with -f values-prod.yaml
```

### Quick Remediation
```bash
# Check current configuration
kubectl get pod <pod-name> -o yaml | grep -B 2 -A 10 "resources:"

# Set reasonable resource requests/limits
kubectl set resources deployment <deployment-name> \
  --requests=cpu=250m,memory=256Mi \
  --limits=cpu=500m,memory=512Mi

# Verify fit on nodes
kubectl top nodes
kubectl describe node <node-name> | grep -A 15 "Allocated resources"

# Restart pods
kubectl rollout restart deployment <deployment-name>

# Monitor scheduling
kubectl get pods -w
```
