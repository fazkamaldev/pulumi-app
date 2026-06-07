import * as aws from "@pulumi/aws";

export function createEcrRepos() {
  const backendRepo = new aws.ecr.Repository("backend-repo", {
    name: "pulumi-app-backend",
    forceDelete: true,
    imageScanningConfiguration: { scanOnPush: true },
  });

  const frontendRepo = new aws.ecr.Repository("frontend-repo", {
    name: "pulumi-app-frontend",
    forceDelete: true,
    imageScanningConfiguration: { scanOnPush: true },
  });

  return { backendRepo, frontendRepo };
}
