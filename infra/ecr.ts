import * as aws from "@pulumi/aws";

export function createEcrRepos() {
  const settingsRepo = new aws.ecr.Repository("settings-repo", {
    name: "pulumi-app-settings",
    forceDelete: true,
    imageScanningConfiguration: { scanOnPush: true },
  });

  const brandRepo = new aws.ecr.Repository("brand-repo", {
    name: "pulumi-app-brand",
    forceDelete: true,
    imageScanningConfiguration: { scanOnPush: true },
  });

  const carRepo = new aws.ecr.Repository("car-repo", {
    name: "pulumi-app-car",
    forceDelete: true,
    imageScanningConfiguration: { scanOnPush: true },
  });

  const frontendRepo = new aws.ecr.Repository("frontend-repo", {
    name: "pulumi-app-frontend",
    forceDelete: true,
    imageScanningConfiguration: { scanOnPush: true },
  });

  return { settingsRepo, brandRepo, carRepo, frontendRepo };
}
