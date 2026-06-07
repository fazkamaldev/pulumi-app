import * as pulumi from "@pulumi/pulumi";
import { createDatabase } from "./database";
import { createEcrRepos } from "./ecr";
import { createEcs, createSecurityGroups } from "./ecs";
import { createNetwork } from "./network";

const config = new pulumi.Config();
const dbPassword = config.requireSecret("dbPassword");

const { settingsRepo, brandRepo, carRepo, frontendRepo } = createEcrRepos();
const net = createNetwork();
const { albSg, ecsSg } = createSecurityGroups(net.vpc.id);

const { db } = createDatabase(
  net.vpc.id,
  [net.privateSubnetA.id, net.privateSubnetB.id],
  ecsSg.id,
);

const databaseUrl = pulumi.interpolate`mysql+pymysql://app:${dbPassword}@${db.address}:3306/appdb`;

const ecs = createEcs({
  vpcId: net.vpc.id,
  publicSubnetIds: [net.publicSubnetA.id, net.publicSubnetB.id],
  privateSubnetIds: [net.privateSubnetA.id, net.privateSubnetB.id],
  albSgId: albSg.id,
  ecsSgId: ecsSg.id,
  settingsImage: settingsRepo.repositoryUrl.apply((url) => `${url}:latest`),
  brandImage: brandRepo.repositoryUrl.apply((url) => `${url}:latest`),
  carImage: carRepo.repositoryUrl.apply((url) => `${url}:latest`),
  frontendImage: frontendRepo.repositoryUrl.apply((url) => `${url}:latest`),
  databaseUrl,
});

export const settingsEcrUrl = settingsRepo.repositoryUrl;
export const brandEcrUrl = brandRepo.repositoryUrl;
export const carEcrUrl = carRepo.repositoryUrl;
export const frontendEcrUrl = frontendRepo.repositoryUrl;
export const appUrl = pulumi.interpolate`http://${ecs.albUrl}`;
export const dbEndpoint = db.address;
export const clusterName = ecs.cluster.name;
