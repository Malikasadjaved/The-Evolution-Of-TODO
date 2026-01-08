#!/bin/bash

# Kubernetes Diagnostic Tool
# Usage: ./k8s-diagnose.sh [pod-name] [namespace]
# or: ./k8s-diagnose.sh --cluster (for cluster-wide diagnostics)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
POD_NAME="${1:-}"
NAMESPACE="${2:-default}"
CLUSTER_MODE=false

if [[ "$1" == "--cluster" ]]; then
    CLUSTER_MODE=true
fi

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Cluster diagnostics
diagnose_cluster() {
    print_header "Cluster Diagnostics"

    print_info "Cluster version:"
    kubectl version --short 2>/dev/null || print_error "Cannot get cluster version"

    print_info "Cluster context:"
    kubectl config current-context

    print_info "Namespaces:"
    kubectl get namespaces

    print_header "Node Status"
    kubectl get nodes -o wide

    print_header "Resource Usage"
    if kubectl top nodes &>/dev/null; then
        kubectl top nodes
    else
        print_warning "metrics-server not available (run: kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml)"
    fi

    print_header "Node Pressure"
    kubectl describe nodes | grep -E "Pressure|PID" | sort | uniq

    print_header "Pending Pods"
    if kubectl get pods -A --field-selector=status.phase=Pending 2>/dev/null | grep -q "pending"; then
        kubectl get pods -A --field-selector=status.phase=Pending
    else
        print_success "No pending pods"
    fi

    print_header "Recent Events"
    kubectl get events -A --sort-by='.lastTimestamp' | tail -20
}

# Pod diagnostics
diagnose_pod() {
    local pod=$1
    local ns=$2

    print_header "Pod Diagnostics: $pod (namespace: $ns)"

    # Check if pod exists
    if ! kubectl get pod "$pod" -n "$ns" &>/dev/null; then
        print_error "Pod '$pod' not found in namespace '$ns'"
        return 1
    fi

    print_header "Pod Status"
    kubectl get pod "$pod" -n "$ns" -o wide

    print_header "Pod Details"
    kubectl describe pod "$pod" -n "$ns"

    print_header "Container Logs"
    if kubectl logs "$pod" -n "$ns" &>/dev/null; then
        kubectl logs "$pod" -n "$ns" --tail=50
    else
        print_warning "No logs available"
    fi

    print_header "Previous Container Logs (if exists)"
    if kubectl logs "$pod" -n "$ns" --previous 2>/dev/null; then
        kubectl logs "$pod" -n "$ns" --previous --tail=50
    else
        print_info "No previous logs (pod hasn't crashed)"
    fi

    print_header "Pod Resource Usage"
    if kubectl top pod "$pod" -n "$ns" &>/dev/null; then
        kubectl top pod "$pod" -n "$ns" --containers
    else
        print_warning "metrics-server not available"
    fi

    print_header "Pod Resource Configuration"
    kubectl get pod "$pod" -n "$ns" -o yaml | grep -A 15 "resources:" || print_info "No resource limits set"

    print_header "Pod Security Context"
    kubectl get pod "$pod" -n "$ns" -o yaml | grep -A 10 "securityContext:" || print_info "No security context set"

    print_header "Pod Network"
    echo "Pod IP: $(kubectl get pod "$pod" -n "$ns" -o jsonpath='{.status.podIP}')"
    echo "Node: $(kubectl get pod "$pod" -n "$ns" -o jsonpath='{.spec.nodeName}')"

    # Try to exec into pod if it's running
    if [[ "$(kubectl get pod "$pod" -n "$ns" -o jsonpath='{.status.phase}')" == "Running" ]]; then
        print_header "Pod Filesystem Info"
        if kubectl exec "$pod" -n "$ns" -- ls / &>/dev/null; then
            echo "Root directory:"
            kubectl exec "$pod" -n "$ns" -- ls -la / 2>/dev/null || print_warning "Cannot list root"
        fi

        print_header "Pod Environment Variables"
        if kubectl exec "$pod" -n "$ns" -- env &>/dev/null; then
            kubectl exec "$pod" -n "$ns" -- env | sort || print_warning "Cannot get environment"
        fi

        print_header "Pod Networking"
        if kubectl exec "$pod" -n "$ns" -- cat /etc/resolv.conf 2>/dev/null; then
            echo ""
        else
            print_warning "Cannot read /etc/resolv.conf"
        fi
    else
        print_warning "Pod is not running; cannot exec into it"
    fi
}

# Service diagnostics
diagnose_services() {
    local ns=$1

    print_header "Service Diagnostics (namespace: $ns)"

    print_header "Services"
    kubectl get svc -n "$ns"

    print_header "Endpoints"
    kubectl get endpoints -n "$ns"

    # Check for services without endpoints
    echo ""
    print_header "Services Without Endpoints (potential issue)"
    kubectl get svc -n "$ns" -o json | jq '.items[] | select(.spec.selector != null and (.status.loadBalancer.ingress == null)) | {name: .metadata.name, selector: .spec.selector}' 2>/dev/null || print_info "Could not analyze services"
}

# Deployment diagnostics
diagnose_deployment() {
    local ns=$1

    print_header "Deployment Diagnostics (namespace: $ns)"

    print_header "Deployments"
    kubectl get deployment -n "$ns" -o wide

    print_header "ReplicaSets"
    kubectl get replicaset -n "$ns" -o wide

    print_header "Deployment History"
    if kubectl rollout history deployment --all -n "$ns" &>/dev/null; then
        kubectl rollout history deployment --all -n "$ns"
    else
        print_info "No deployment history available"
    fi
}

# Network policy diagnostics
diagnose_network_policies() {
    local ns=$1

    print_header "Network Policy Diagnostics (namespace: $ns)"

    if kubectl get networkpolicies -n "$ns" &>/dev/null; then
        kubectl get networkpolicies -n "$ns"
        echo ""
        kubectl describe networkpolicies -n "$ns"
    else
        print_info "No network policies defined"
    fi
}

# ConfigMap and Secret diagnostics
diagnose_config() {
    local ns=$1

    print_header "Configuration (namespace: $ns)"

    print_header "ConfigMaps"
    kubectl get cm -n "$ns"

    print_header "Secrets (names only, values hidden)"
    kubectl get secrets -n "$ns"
}

# Generate diagnostic report
generate_report() {
    local report_file="k8s-diagnostic-report-$(date +%Y%m%d-%H%M%S).txt"

    print_header "Generating Report: $report_file"

    {
        echo "Kubernetes Diagnostic Report"
        echo "Generated: $(date)"
        echo ""

        if [[ $CLUSTER_MODE == true ]]; then
            diagnose_cluster
        else
            diagnose_pod "$POD_NAME" "$NAMESPACE"
            diagnose_services "$NAMESPACE"
            diagnose_deployment "$NAMESPACE"
            diagnose_network_policies "$NAMESPACE"
            diagnose_config "$NAMESPACE"
        fi
    } | tee "$report_file"

    print_success "Report saved to: $report_file"
}

# Main execution
main() {
    if [[ $CLUSTER_MODE == true ]]; then
        generate_report
    elif [[ -z "$POD_NAME" ]]; then
        echo "Kubernetes Diagnostic Tool"
        echo ""
        echo "Usage:"
        echo "  $0 <pod-name> [namespace]       - Diagnose specific pod"
        echo "  $0 --cluster                     - Cluster-wide diagnostics"
        echo ""
        echo "Examples:"
        echo "  $0 nginx-pod                     - Diagnose pod in 'default' namespace"
        echo "  $0 nginx-pod production          - Diagnose pod in 'production' namespace"
        echo "  $0 --cluster                     - Cluster-wide diagnostics"
        echo ""
        exit 1
    else
        generate_report
    fi
}

main "$@"
