import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export function createDatabase(
  vpcId: pulumi.Input<string>,
  subnetIds: pulumi.Input<string>[],
  ecsSecurityGroupId: pulumi.Input<string>,
) {
  const cfg = new pulumi.Config();
  const dbPassword = cfg.requireSecret("dbPassword");

  const sg = new aws.ec2.SecurityGroup("db-sg", {
    vpcId,
    description: "Allow MySQL from ECS tasks",
    ingress: [
      {
        protocol: "tcp",
        fromPort: 3306,
        toPort: 3306,
        securityGroups: [ecsSecurityGroupId],
      },
    ],
    egress: [
      {
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"],
      },
    ],
    tags: { Name: "pulumi-app-db-sg" },
  });

  const subnetGroup = new aws.rds.SubnetGroup("db-subnet-group", {
    subnetIds,
    tags: { Name: "pulumi-app-db-subnet-group" },
  });

  const db = new aws.rds.Instance("mysql", {
    engine: "mysql",
    engineVersion: "8.4",
    instanceClass: "db.t3.micro",
    allocatedStorage: 20,
    dbName: "appdb",
    username: "app",
    password: dbPassword,
    vpcSecurityGroupIds: [sg.id],
    dbSubnetGroupName: subnetGroup.name,
    skipFinalSnapshot: true,
    publiclyAccessible: false,
    tags: { Name: "pulumi-app-mysql" },
  });

  return { db, dbSg: sg };
}
