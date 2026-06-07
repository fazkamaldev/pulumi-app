#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INFRA_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$INFRA_DIR/.." && pwd)"
REGION="${AWS_REGION:-ap-southeast-2}"

if ! command -v pulumi >/dev/null; then
  echo "pulumi CLI is required"
  exit 1
fi

cd "$INFRA_DIR"
BACKEND_ECR=$(pulumi stack output backendEcrUrl)
FRONTEND_ECR=$(pulumi stack output frontendEcrUrl)
APP_URL=$(pulumi stack output appUrl)

# ... ECR login unchanged ...

docker build --platform linux/amd64 -t pulumi-app-backend "$REPO_ROOT/backend"
# ...
docker build --build-arg VITE_API_URL= -t pulumi-app-frontend "$REPO_ROOT/frontend"