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
SETTINGS_ECR=$(pulumi stack output settingsEcrUrl)
BRAND_ECR=$(pulumi stack output brandEcrUrl)
CAR_ECR=$(pulumi stack output carEcrUrl)
FRONTEND_ECR=$(pulumi stack output frontendEcrUrl)
APP_URL=$(pulumi stack output appUrl)
CLUSTER=$(pulumi stack output clusterName)

ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
REGISTRY="${ACCOUNT}.dkr.ecr.${REGION}.amazonaws.com"

aws ecr get-login-password --region "$REGION" \
  | docker login --username AWS --password-stdin "$REGISTRY"

docker build --platform linux/amd64 -t pulumi-app-settings "$REPO_ROOT/backend-settings"
docker tag pulumi-app-settings:latest "${SETTINGS_ECR}:latest"
docker push "${SETTINGS_ECR}:latest"

docker build --platform linux/amd64 -t pulumi-app-brand "$REPO_ROOT/backend-brand"
docker tag pulumi-app-brand:latest "${BRAND_ECR}:latest"
docker push "${BRAND_ECR}:latest"

docker build --platform linux/amd64 -t pulumi-app-car "$REPO_ROOT/backend-car"
docker tag pulumi-app-car:latest "${CAR_ECR}:latest"
docker push "${CAR_ECR}:latest"

docker build --platform linux/amd64 \
  --build-arg INIT_SETTINGS_API_URL= \
  --build-arg INIT_BRAND_API_URL= \
  --build-arg INIT_CAR_API_URL= \
  -t pulumi-app-frontend "$REPO_ROOT/frontend"
docker tag pulumi-app-frontend:latest "${FRONTEND_ECR}:latest"
docker push "${FRONTEND_ECR}:latest"

for SERVICE in settings brand car frontend; do
  aws ecs update-service \
    --cluster "$CLUSTER" \
    --service "pulumi-app-${SERVICE}" \
    --force-new-deployment \
    --region "$REGION"
done

echo "Deployed. App URL: $APP_URL"
