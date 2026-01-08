#!/bin/bash

# Security Scan Script for Docker Images
# Phase IV: Kubernetes Deployment
# Uses Trivy for vulnerability scanning

set -e

echo "🔒 Security Scan: Docker Image Vulnerability Analysis"
echo "======================================================"
echo ""

# Check if Trivy is installed
if ! command -v trivy &> /dev/null; then
    echo "❌ Trivy is not installed!"
    echo ""
    echo "📥 Installation instructions:"
    echo ""
    echo "Windows (via Chocolatey):"
    echo "  choco install trivy"
    echo ""
    echo "Windows (via Scoop):"
    echo "  scoop install trivy"
    echo ""
    echo "Linux/WSL (via apt):"
    echo "  sudo apt-get install wget apt-transport-https gnupg lsb-release"
    echo "  wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | gpg --dearmor | sudo tee /usr/share/keyrings/trivy.gpg > /dev/null"
    echo "  echo \"deb [signed-by=/usr/share/keyrings/trivy.gpg] https://aquasecurity.github.io/trivy-repo/deb \$(lsb_release -sc) main\" | sudo tee -a /etc/apt/sources.list.d/trivy.list"
    echo "  sudo apt-get update"
    echo "  sudo apt-get install trivy"
    echo ""
    echo "macOS (via Homebrew):"
    echo "  brew install trivy"
    echo ""
    echo "For more installation options, see:"
    echo "  https://aquasecurity.github.io/trivy/latest/getting-started/installation/"
    echo ""
    exit 1
fi

echo "✅ Trivy is installed"
echo ""

# Update Trivy database
echo "🔄 Updating Trivy vulnerability database..."
trivy image --download-db-only
echo ""

# Configure Docker environment to use Minikube
echo "🐳 Configuring Docker environment for Minikube..."
eval $(minikube docker-env 2>/dev/null) || true
echo ""

# List of images to scan
IMAGES=(
    "todo-backend:latest"
    "todo-frontend-web:latest"
    "todo-frontend-chatbot:latest"
)

# Severity thresholds
SEVERITY_LEVELS="CRITICAL,HIGH"

# Create output directory
OUTPUT_DIR="security-reports"
mkdir -p "$OUTPUT_DIR"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Summary counters
TOTAL_IMAGES=0
TOTAL_CRITICAL=0
TOTAL_HIGH=0
TOTAL_MEDIUM=0
TOTAL_LOW=0
FAILED_IMAGES=()

echo "🔍 Scanning Docker images for vulnerabilities..."
echo "Severity levels: $SEVERITY_LEVELS"
echo ""

# Scan each image
for IMAGE in "${IMAGES[@]}"; do
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📦 Scanning: $IMAGE"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Check if image exists
    if ! docker images | grep -q "$(echo $IMAGE | cut -d':' -f1)"; then
        echo "⚠️  Image not found: $IMAGE"
        echo "   Skipping scan..."
        FAILED_IMAGES+=("$IMAGE")
        echo ""
        continue
    fi

    TOTAL_IMAGES=$((TOTAL_IMAGES + 1))

    # Generate report file name
    IMAGE_NAME=$(echo "$IMAGE" | sed 's/:/-/g' | sed 's/\//-/g')
    REPORT_FILE="$OUTPUT_DIR/${IMAGE_NAME}-${TIMESTAMP}.txt"
    JSON_REPORT="$OUTPUT_DIR/${IMAGE_NAME}-${TIMESTAMP}.json"

    # Scan image and save to file
    echo "📝 Generating report: $REPORT_FILE"

    trivy image \
        --severity "$SEVERITY_LEVELS" \
        --format table \
        --output "$REPORT_FILE" \
        "$IMAGE"

    # Generate JSON report for programmatic analysis
    trivy image \
        --severity "$SEVERITY_LEVELS" \
        --format json \
        --output "$JSON_REPORT" \
        "$IMAGE"

    # Count vulnerabilities
    CRITICAL=$(grep -c "CRITICAL" "$REPORT_FILE" || true)
    HIGH=$(grep -c "HIGH" "$REPORT_FILE" || true)

    TOTAL_CRITICAL=$((TOTAL_CRITICAL + CRITICAL))
    TOTAL_HIGH=$((TOTAL_HIGH + HIGH))

    echo ""
    echo "📊 Scan Results for $IMAGE:"
    echo "   - CRITICAL: $CRITICAL"
    echo "   - HIGH: $HIGH"
    echo ""

    # Display summary from report
    if [ -f "$REPORT_FILE" ]; then
        echo "Preview of top vulnerabilities:"
        head -n 30 "$REPORT_FILE" || true
    fi

    echo ""
done

# Generate summary report
SUMMARY_FILE="$OUTPUT_DIR/summary-${TIMESTAMP}.txt"

cat > "$SUMMARY_FILE" <<EOF
Security Scan Summary
=====================
Scan Date: $(date)
Images Scanned: $TOTAL_IMAGES

Vulnerability Counts:
---------------------
CRITICAL: $TOTAL_CRITICAL
HIGH:     $TOTAL_HIGH

Images Scanned:
---------------
EOF

for IMAGE in "${IMAGES[@]}"; do
    if [[ ! " ${FAILED_IMAGES[@]} " =~ " ${IMAGE} " ]]; then
        echo "✅ $IMAGE" >> "$SUMMARY_FILE"
    fi
done

if [ ${#FAILED_IMAGES[@]} -gt 0 ]; then
    echo "" >> "$SUMMARY_FILE"
    echo "Failed/Skipped Images:" >> "$SUMMARY_FILE"
    echo "----------------------" >> "$SUMMARY_FILE"
    for IMAGE in "${FAILED_IMAGES[@]}"; do
        echo "❌ $IMAGE" >> "$SUMMARY_FILE"
    done
fi

cat >> "$SUMMARY_FILE" <<EOF

Report Location:
----------------
$(pwd)/$OUTPUT_DIR/

Individual Reports:
EOF

for REPORT in $OUTPUT_DIR/*-${TIMESTAMP}.txt; do
    if [ -f "$REPORT" ]; then
        echo "  - $(basename $REPORT)" >> "$SUMMARY_FILE"
    fi
done

cat >> "$SUMMARY_FILE" <<EOF

Recommendations:
----------------
1. Review all CRITICAL vulnerabilities immediately
2. Plan remediation for HIGH vulnerabilities
3. Update base images and dependencies
4. Rebuild images after applying patches
5. Re-scan to verify fixes

For detailed reports, see individual files in:
  $OUTPUT_DIR/

EOF

# Display summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 SCAN SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat "$SUMMARY_FILE"
echo ""

# Exit with error if critical vulnerabilities found
if [ $TOTAL_CRITICAL -gt 0 ]; then
    echo "⚠️  WARNING: $TOTAL_CRITICAL CRITICAL vulnerabilities found!"
    echo "   Action required: Review and remediate critical issues"
    echo ""
    exit 1
elif [ $TOTAL_HIGH -gt 0 ]; then
    echo "⚠️  WARNING: $TOTAL_HIGH HIGH vulnerabilities found!"
    echo "   Recommendation: Plan remediation for high-severity issues"
    echo ""
    exit 0
else
    echo "✅ No CRITICAL or HIGH vulnerabilities found!"
    echo ""
    exit 0
fi
