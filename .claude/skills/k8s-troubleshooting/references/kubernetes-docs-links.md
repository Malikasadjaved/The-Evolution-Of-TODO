# Kubernetes Official Documentation Links

## Core Troubleshooting Guides

| Topic | URL | Notes |
|-------|-----|-------|
| **Debug Application** | https://kubernetes.io/docs/tasks/debug/debug-application/ | Core troubleshooting guide |
| **Determine Pod Failure Reason** | https://kubernetes.io/docs/tasks/debug/debug-application/determine-reason-pod-failure/ | Identify why pods fail |
| **Debug Pods** | https://kubernetes.io/docs/tasks/debug/debug-application/debug-pods/ | Interactive debugging techniques |
| **Debug Services** | https://kubernetes.io/docs/tasks/debug/debug-application/debug-service/ | Service connectivity issues |
| **Debug Running Pods** | https://kubernetes.io/docs/tasks/debug/debug-application/debug-running-pod/ | Exec into running containers |
| **Get Shell to Running Container** | https://kubernetes.io/docs/tasks/debug/debug-application/get-shell-running-container/ | Interactive shell access |
| **Debug Init Containers** | https://kubernetes.io/docs/tasks/debug/debug-application/debug-init-containers/ | Init container specific issues |
| **Debug Cluster** | https://kubernetes.io/docs/tasks/debug/debug-cluster/ | Cluster-level issues |

---

## Kubernetes Concepts

| Topic | URL | Notes |
|-------|-----|-------|
| **Pod Lifecycle** | https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/ | Pod phases and status |
| **Init Containers** | https://kubernetes.io/docs/concepts/workloads/pods/init-containers/ | How init containers work |
| **Container Lifecycle Hooks** | https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/ | PostStart, PreStop hooks |
| **Resource Management** | https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/ | Requests, limits, QoS |
| **Health Checks** | https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/ | Liveness, readiness, startup probes |
| **Deployments** | https://kubernetes.io/docs/concepts/workloads/controllers/deployment/ | Rolling updates, rollbacks |

---

## Configuration

| Topic | URL | Notes |
|-------|-----|-------|
| **ConfigMaps** | https://kubernetes.io/docs/concepts/configuration/configmap/ | Non-secret configuration |
| **Secrets** | https://kubernetes.io/docs/concepts/configuration/secret/ | Sensitive data storage |
| **Environment Variables** | https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/ | Pass config to containers |
| **Service Accounts** | https://kubernetes.io/docs/concepts/security/service-accounts/ | Pod authentication |
| **RBAC** | https://kubernetes.io/docs/reference/access-authn-authz/rbac/ | Role-based access control |

---

## Networking

| Topic | URL | Notes |
|-------|-----|-------|
| **Services** | https://kubernetes.io/docs/concepts/services-networking/service/ | Service types, endpoints |
| **DNS for Services** | https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/ | DNS resolution in cluster |
| **Network Policies** | https://kubernetes.io/docs/concepts/services-networking/network-policies/ | Network traffic control |
| **Ingress** | https://kubernetes.io/docs/concepts/services-networking/ingress/ | External HTTP access |

---

## Storage

| Topic | URL | Notes |
|-------|-----|-------|
| **Volumes** | https://kubernetes.io/docs/concepts/storage/volumes/ | Persistent and ephemeral storage |
| **PersistentVolumes** | https://kubernetes.io/docs/concepts/storage/persistent-volumes/ | PV and PVC concepts |
| **Storage Classes** | https://kubernetes.io/docs/concepts/storage/storage-classes/ | Dynamic provisioning |

---

## Kubectl Reference

| Topic | URL | Notes |
|-------|-----|-------|
| **Kubectl Overview** | https://kubernetes.io/docs/reference/kubectl/overview/ | General kubectl info |
| **Kubectl Cheat Sheet** | https://kubernetes.io/docs/reference/kubectl/quick-reference/ | Common commands |
| **Kubectl Commands** | https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands/ | Full command reference |
| **JSONPath Support** | https://kubernetes.io/docs/reference/kubectl/jsonpath/ | Query with JSONPath |

---

## Resource Types

| Topic | URL | Notes |
|-------|-----|-------|
| **Pod** | https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.28/#pod-v1-core | Pod API reference |
| **Deployment** | https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.28/#deployment-v1-apps | Deployment API reference |
| **Service** | https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.28/#service-v1-core | Service API reference |
| **Node** | https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.28/#node-v1-core | Node API reference |

---

## Logging & Monitoring

| Topic | URL | Notes |
|-------|-----|-------|
| **Logging Architecture** | https://kubernetes.io/docs/concepts/cluster-administration/logging/ | Cluster and pod logging |
| **Metrics** | https://kubernetes.io/docs/tasks/debug/debug-cluster/resource-metrics-pipeline/ | Metrics-server and top commands |
| **Node Status** | https://kubernetes.io/docs/concepts/nodes/node/ | Node monitoring and conditions |

---

## Best Practices

| Topic | URL | Notes |
|-------|-----|-------|
| **Cluster Hardening** | https://kubernetes.io/docs/concepts/security/hardening/ | Security best practices |
| **Pod Security Policies** | https://kubernetes.io/docs/concepts/policy/pod-security-policy/ | Pod-level security controls |
| **Network Policies** | https://kubernetes.io/docs/concepts/services-networking/network-policies/ | Network security |
| **RBAC Best Practices** | https://kubernetes.io/docs/concepts/security/rbac-good-practices/ | Access control patterns |

---

## Quick Links by Scenario

### ImagePullBackOff

- [Determine Pod Failure Reason](https://kubernetes.io/docs/tasks/debug/debug-application/determine-reason-pod-failure/)
- [Secrets for Docker Hub](https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/)

### CrashLoopBackOff

- [Debug Pods](https://kubernetes.io/docs/tasks/debug/debug-application/debug-pods/)
- [Pod Lifecycle](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/)
- [Liveness Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)

### Pending Pods

- [Resource Management](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/)
- [Scheduling Concepts](https://kubernetes.io/docs/concepts/scheduling-eviction/kube-scheduler/)
- [Pod Topology Spread](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/)

### Networking Issues

- [Debug Services](https://kubernetes.io/docs/tasks/debug/debug-application/debug-service/)
- [DNS for Services](https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/)
- [Network Policies](https://kubernetes.io/docs/concepts/services-networking/network-policies/)

### Performance Issues

- [Resource Management](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/)
- [Quality of Service](https://kubernetes.io/docs/tasks/configure-pod-container/quality-service-pod/)
- [Horizontal Pod Autoscaler](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)

### Init Container Issues

- [Init Containers](https://kubernetes.io/docs/concepts/workloads/pods/init-containers/)
- [Debug Init Containers](https://kubernetes.io/docs/tasks/debug/debug-application/debug-init-containers/)

---

## Version-Specific Information

**Documentation Version**: Current stable Kubernetes (v1.28+)
**Compatibility**: Most information applies to v1.25+

For older versions, adjust the documentation URL:
- v1.27: https://kubernetes.io/docs/concepts/.../
- v1.26: https://kubernetes.io/docs/concepts/.../

Check your cluster version:
```bash
kubectl version --short
```

---

## Community Resources

| Resource | URL | Notes |
|----------|-----|-------|
| **Kubernetes Slack** | https://kubernetes.io/community/ | Community support channels |
| **Kubernetes Forums** | https://discuss.kubernetes.io/ | Discussion forum |
| **Stack Overflow** | https://stackoverflow.com/questions/tagged/kubernetes | Q&A |
| **KubernetesCommunity** | https://github.com/kubernetes/community | Community docs |

---

## Tools & Extensions

| Tool | URL | Notes |
|------|-----|-------|
| **kubectl Plugins** | https://krew.sigs.k8s.io/ | kubectl package manager |
| **Helm** | https://helm.sh/docs/ | Package manager for Kubernetes |
| **Kustomize** | https://kustomize.io/ | Template-free customization |
| **Prometheus** | https://prometheus.io/docs/prometheus/latest/configuration/configuration/ | Monitoring stack |
