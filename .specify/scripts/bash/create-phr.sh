#!/bin/bash
# PHR (Prompt History Record) Creation Script
# Usage: ./create-phr.sh --title "<title>" --stage <stage> [--feature <name>] --json

set -e

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --title)
            TITLE="$2"
            shift 2
            ;;
        --stage)
            STAGE="$2"
            shift 2
            ;;
        --feature)
            FEATURE="$2"
            shift 2
            ;;
        --json)
            JSON_OUTPUT=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Validate required arguments
if [[ -z "$TITLE" || -z "$STAGE" ]]; then
    echo "Error: --title and --stage are required"
    exit 1
fi

# Determine routing based on stage
case $STAGE in
    constitution)
        ROUTING="history/prompts/constitution"
        ;;
    spec|plan|tasks|red|green|refactor|explainer|misc)
        if [[ -z "$FEATURE" ]]; then
            echo "Error: --feature is required for stage '$STAGE'"
            exit 1
        fi
        ROUTING="history/prompts/$FEATURE"
        ;;
    general)
        ROUTING="history/prompts/general"
        ;;
    *)
        echo "Error: Invalid stage '$STAGE'"
        echo "Valid stages: constitution, spec, plan, tasks, red, green, refactor, explainer, misc, general"
        exit 1
        ;;
esac

# Create directory if needed
mkdir -p "$ROUTING"

# Find next ID
ID=1
while [[ -f "$ROUTING/$(printf '%03d' $ID)-*.md" ]]; do
    ID=$((ID + 1))
done

# Generate filename
FILENAME="$ROUTING/$(printf '%03d' $ID)-$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | tr ' ' '-').$STAGE.prompt.md"

# Output JSON if requested
if [[ "$JSON_OUTPUT" == "true" ]]; then
    cat <<EOF
{
  "id": "$(printf '%03d' $ID)",
  "path": "$FILENAME",
  "context": "$ROUTING",
  "stage": "$STAGE",
  "feature": "${FEATURE:-none}"
}
EOF
else
    echo "Created: $FILENAME"
    echo "ID: $(printf '%03d' $ID)"
fi
