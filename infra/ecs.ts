import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

const project = pulumi.getProject();
const awsRegion = aws.config.region ?? "ap-southeast-2";

type BackendServiceArgs = {
  name: string;
  image: pulumi.Input<string>;
  databaseUrl: pulumi.Input<string>;
  vpcId: pulumi.Input<string>;
  privateSubnetIds: pulumi.Input<string>[];
  ecsSgId: pulumi.Input<string>;
  clusterArn: pulumi.Input<string>;
  listenerArn: pulumi.Input<string>;
  listenerPriority: number;
  pathPatterns: string[];
  executionRoleArn: pulumi.Input<string>;
  taskRoleArn: pulumi.Input<string>;
  dependsOn: pulumi.Resource[];
};

function createBackendMicroservice(args: BackendServiceArgs) {
  const logGroup = new aws.cloudwatch.LogGroup(`${args.name}-logs`, {
    name: `/ecs/${project}/${args.name}`,
    retentionInDays: 7,
  });

  const targetGroup = new aws.lb.TargetGroup(`${args.name}-tg`, {
    name: `${project}-${args.name}-tg`,
    port: 8000,
    protocol: "HTTP",
    targetType: "ip",
    vpcId: args.vpcId,
    healthCheck: {
      path: "/health",
      matcher: "200",
    },
    tags: { Name: `${project}-${args.name}-tg` },
  });

  const listenerRule = new aws.lb.ListenerRule(`${args.name}-rule`, {
    listenerArn: args.listenerArn,
    priority: args.listenerPriority,
    actions: [
      {
        type: "forward",
        targetGroupArn: targetGroup.arn,
      },
    ],
    conditions: [
      {
        pathPattern: {
          values: args.pathPatterns,
        },
      },
    ],
  });

  const taskDefinition = new aws.ecs.TaskDefinition(`${args.name}-task`, {
    family: `${project}-${args.name}`,
    cpu: "256",
    memory: "512",
    networkMode: "awsvpc",
    requiresCompatibilities: ["FARGATE"],
    executionRoleArn: args.executionRoleArn,
    taskRoleArn: args.taskRoleArn,
    containerDefinitions: pulumi
      .all([args.image, args.databaseUrl, logGroup.name])
      .apply(([image, databaseUrl, logGroupName]) =>
        JSON.stringify([
          {
            name: args.name,
            image,
            essential: true,
            portMappings: [{ containerPort: 8000, protocol: "tcp" }],
            environment: [{ name: "DATABASE_URL", value: databaseUrl }],
            logConfiguration: {
              logDriver: "awslogs",
              options: {
                "awslogs-group": logGroupName,
                "awslogs-region": awsRegion,
                "awslogs-stream-prefix": args.name,
              },
            },
          },
        ]),
      ),
  });

  const service = new aws.ecs.Service(
    `${args.name}-service`,
    {
      name: `${project}-${args.name}`,
      cluster: args.clusterArn,
      taskDefinition: taskDefinition.arn,
      desiredCount: 1,
      launchType: "FARGATE",
      networkConfiguration: {
        subnets: args.privateSubnetIds,
        securityGroups: [args.ecsSgId],
        assignPublicIp: false,
      },
      loadBalancers: [
        {
          targetGroupArn: targetGroup.arn,
          containerName: args.name,
          containerPort: 8000,
        },
      ],
    },
    { dependsOn: [...args.dependsOn, listenerRule] },
  );

  return { service, listenerRule };
}

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
  settingsImage: pulumi.Input<string>;
  brandImage: pulumi.Input<string>;
  carImage: pulumi.Input<string>;
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

  const sharedBackendArgs = {
    vpcId: args.vpcId,
    privateSubnetIds: args.privateSubnetIds,
    ecsSgId: args.ecsSgId,
    clusterArn: cluster.arn,
    listenerArn: listener.arn,
    executionRoleArn: executionRole.arn,
    taskRoleArn: taskRole.arn,
    databaseUrl: args.databaseUrl,
    dependsOn: [listener],
  };

  const brand = createBackendMicroservice({
    ...sharedBackendArgs,
    name: "brand",
    image: args.brandImage,
    listenerPriority: 10,
    pathPatterns: ["/brands", "/brands/*"],
  });

  const car = createBackendMicroservice({
    ...sharedBackendArgs,
    name: "car",
    image: args.carImage,
    listenerPriority: 20,
    pathPatterns: ["/cars", "/cars/*"],
  });

  const settings = createBackendMicroservice({
    ...sharedBackendArgs,
    name: "settings",
    image: args.settingsImage,
    listenerPriority: 30,
    pathPatterns: [
      "/settings",
      "/settings/*",
      "/docs",
      "/docs/*",
      "/openapi.json",
      "/redoc",
    ],
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
                "awslogs-region": awsRegion,
                "awslogs-stream-prefix": "frontend",
              },
            },
          },
        ]),
      ),
  });

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
    settingsService: settings.service,
    brandService: brand.service,
    carService: car.service,
    frontendService,
  };
}
