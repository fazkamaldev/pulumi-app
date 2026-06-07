import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

const project = pulumi.getProject();

export function createSecurityGroups(vpcId: pulumi.Input<string>) {
  const albSg = new aws.ec2.SecurityGroup("alb-sg", {
    vpcId,
    description: "Allow HTTP to ALB",
    ingress: [
      {
        protocol: "tcp",
        fromPort: 80,
        toPort: 80,
        cidrBlocks: ["0.0.0.0/0"],
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
    tags: { Name: "pulumi-app-alb-sg" },
  });

  const ecsSg = new aws.ec2.SecurityGroup("ecs-sg", {
    vpcId,
    description: "Allow traffic from ALB to ECS tasks",
    egress: [
      {
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"],
      },
    ],
    tags: { Name: "pulumi-app-ecs-sg" },
  });

  new aws.ec2.SecurityGroupRule("alb-to-ecs-http", {
    type: "ingress",
    securityGroupId: ecsSg.id,
    sourceSecurityGroupId: albSg.id,
    protocol: "tcp",
    fromPort: 80,
    toPort: 80,
  });

  new aws.ec2.SecurityGroupRule("alb-to-ecs-api", {
    type: "ingress",
    securityGroupId: ecsSg.id,
    sourceSecurityGroupId: albSg.id,
    protocol: "tcp",
    fromPort: 8000,
    toPort: 8000,
  });

  return { albSg, ecsSg };
}

export function createEcs(args: {
  vpcId: pulumi.Input<string>;
  publicSubnetIds: pulumi.Input<string>[];
  privateSubnetIds: pulumi.Input<string>[];
  albSgId: pulumi.Input<string>;
  ecsSgId: pulumi.Input<string>;
  backendImage: pulumi.Input<string>;
  frontendImage: pulumi.Input<string>;
  databaseUrl: pulumi.Input<string>;
}) {
  const cluster = new aws.ecs.Cluster("app-cluster", {
    name: `${project}-cluster`,
    tags: { Name: `${project}-cluster` },
  });

  const executionRole = new aws.iam.Role("ecs-execution-role", {
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
      Service: "ecs-tasks.amazonaws.com",
    }),
  });

  new aws.iam.RolePolicyAttachment("ecs-execution-policy", {
    role: executionRole.name,
    policyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
  });

  const taskRole = new aws.iam.Role("ecs-task-role", {
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
      Service: "ecs-tasks.amazonaws.com",
    }),
  });

  const backendLogGroup = new aws.cloudwatch.LogGroup("backend-logs", {
    name: `/ecs/${project}/backend`,
    retentionInDays: 7,
  });

  const frontendLogGroup = new aws.cloudwatch.LogGroup("frontend-logs", {
    name: `/ecs/${project}/frontend`,
    retentionInDays: 7,
  });

  const alb = new aws.lb.LoadBalancer("app-alb", {
    loadBalancerType: "application",
    securityGroups: [args.albSgId],
    subnets: args.publicSubnetIds,
    tags: { Name: `${project}-alb` },
  });

  const backendTg = new aws.lb.TargetGroup("backend-tg", {
    name: `${project}-backend-tg`,
    port: 8000,
    protocol: "HTTP",
    targetType: "ip",
    vpcId: args.vpcId,
    healthCheck: {
      path: "/health",
      matcher: "200",
    },
    tags: { Name: `${project}-backend-tg` },
  });

  const frontendTg = new aws.lb.TargetGroup("frontend-tg", {
    name: `${project}-frontend-tg`,
    port: 80,
    protocol: "HTTP",
    targetType: "ip",
    vpcId: args.vpcId,
    healthCheck: {
      path: "/",
      matcher: "200",
    },
    tags: { Name: `${project}-frontend-tg` },
  });

  const listener = new aws.lb.Listener("http-listener", {
    loadBalancerArn: alb.arn,
    port: 80,
    defaultActions: [
      {
        type: "forward",
        targetGroupArn: frontendTg.arn,
      },
    ],
  });

  const apiPaths = [
    "/health",
    "/items*",
    "/docs*",
    "/openapi.json",
    "/redoc",
  ];

  const apiRule = new aws.lb.ListenerRule("api-rule", {
    listenerArn: listener.arn,
    priority: 10,
    actions: [
      {
        type: "forward",
        targetGroupArn: backendTg.arn,
      },
    ],
    conditions: [
      {
        pathPattern: {
          values: apiPaths,
        },
      },
    ],
  });

  const backendTaskDef = new aws.ecs.TaskDefinition("backend-task", {
    family: `${project}-backend`,
    cpu: "256",
    memory: "512",
    networkMode: "awsvpc",
    requiresCompatibilities: ["FARGATE"],
    executionRoleArn: executionRole.arn,
    taskRoleArn: taskRole.arn,
    containerDefinitions: pulumi
    .all([args.backendImage, args.databaseUrl, backendLogGroup.name])
    .apply(([image, databaseUrl, logGroupName]) =>
      JSON.stringify([
        {
          name: "backend",
          image,
          essential: true,
          portMappings: [{ containerPort: 8000, protocol: "tcp" }],
          environment: [{ name: "DATABASE_URL", value: databaseUrl }],
          logConfiguration: {
            logDriver: "awslogs",
            options: {
              "awslogs-group": logGroupName,
              "awslogs-region": aws.config.region ?? "ap-southeast-2",
              "awslogs-stream-prefix": "backend",
            },
          },
        },
      ]),
    ),
  });

  const frontendTaskDef = new aws.ecs.TaskDefinition("frontend-task", {
    family: `${project}-frontend`,
    cpu: "256",
    memory: "512",
    networkMode: "awsvpc",
    requiresCompatibilities: ["FARGATE"],
    executionRoleArn: executionRole.arn,
    taskRoleArn: taskRole.arn,
    containerDefinitions: pulumi
    .all([args.frontendImage, frontendLogGroup.name])
    .apply(([image, logGroupName]) =>
      JSON.stringify([
        {
          name: "frontend",
          image,
          essential: true,
          portMappings: [{ containerPort: 80, protocol: "tcp" }],
          logConfiguration: {
            logDriver: "awslogs",
            options: {
              "awslogs-group": logGroupName,
              "awslogs-region": aws.config.region ?? "ap-southeast-2",
              "awslogs-stream-prefix": "frontend",
            },
          },
        },
      ]),
    ),
  });

  const backendService = new aws.ecs.Service(
    "backend-service",
    {
      name: `${project}-backend`,
      cluster: cluster.arn,
      taskDefinition: backendTaskDef.arn,
      desiredCount: 1,
      launchType: "FARGATE",
      networkConfiguration: {
        subnets: args.privateSubnetIds,
        securityGroups: [args.ecsSgId],
        assignPublicIp: false,
      },
      loadBalancers: [
        {
          targetGroupArn: backendTg.arn,
          containerName: "backend",
          containerPort: 8000,
        },
      ],
    },
    { dependsOn: [listener, apiRule] },
  );

  const frontendService = new aws.ecs.Service(
    "frontend-service",
    {
      name: `${project}-frontend`,
      cluster: cluster.arn,
      taskDefinition: frontendTaskDef.arn,
      desiredCount: 1,
      launchType: "FARGATE",
      networkConfiguration: {
        subnets: args.privateSubnetIds,
        securityGroups: [args.ecsSgId],
        assignPublicIp: false,
      },
      loadBalancers: [
        {
          targetGroupArn: frontendTg.arn,
          containerName: "frontend",
          containerPort: 80,
        },
      ],
    },
    { dependsOn: [listener] },
  );

  return {
    cluster,
    alb,
    albUrl: alb.dnsName,
    backendService,
    frontendService,
  };
}
