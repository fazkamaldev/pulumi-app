import * as aws from "@pulumi/aws";

export function createNetwork() {
  const region = aws.config.region ?? "ap-southeast-2";

  const vpc = new aws.ec2.Vpc("app-vpc", {
    cidrBlock: "10.0.0.0/16",
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: { Name: "pulumi-app-vpc" },
  });

  const publicSubnetA = new aws.ec2.Subnet("public-a", {
    vpcId: vpc.id,
    cidrBlock: "10.0.1.0/24",
    availabilityZone: `${region}a`,
    mapPublicIpOnLaunch: true,
    tags: { Name: "pulumi-app-public-a" },
  });

  const publicSubnetB = new aws.ec2.Subnet("public-b", {
    vpcId: vpc.id,
    cidrBlock: "10.0.2.0/24",
    availabilityZone: `${region}b`,
    mapPublicIpOnLaunch: true,
    tags: { Name: "pulumi-app-public-b" },
  });

  const privateSubnetA = new aws.ec2.Subnet("private-a", {
    vpcId: vpc.id,
    cidrBlock: "10.0.11.0/24",
    availabilityZone: `${region}a`,
    tags: { Name: "pulumi-app-private-a" },
  });

  const privateSubnetB = new aws.ec2.Subnet("private-b", {
    vpcId: vpc.id,
    cidrBlock: "10.0.12.0/24",
    availabilityZone: `${region}b`,
    tags: { Name: "pulumi-app-private-b" },
  });

  const igw = new aws.ec2.InternetGateway("igw", {
    vpcId: vpc.id,
    tags: { Name: "pulumi-app-igw" },
  });

  const natEip = new aws.ec2.Eip("nat-eip", {
    domain: "vpc",
    tags: { Name: "pulumi-app-nat-eip" },
  });

  const natGateway = new aws.ec2.NatGateway("nat-gw", {
    allocationId: natEip.id,
    subnetId: publicSubnetA.id,
    tags: { Name: "pulumi-app-nat" },
  });

  const publicRt = new aws.ec2.RouteTable("public-rt", {
    vpcId: vpc.id,
    tags: { Name: "pulumi-app-public-rt" },
  });

  new aws.ec2.Route("public-route", {
    routeTableId: publicRt.id,
    destinationCidrBlock: "0.0.0.0/0",
    gatewayId: igw.id,
  });

  const privateRt = new aws.ec2.RouteTable("private-rt", {
    vpcId: vpc.id,
    tags: { Name: "pulumi-app-private-rt" },
  });

  new aws.ec2.Route("private-route", {
    routeTableId: privateRt.id,
    destinationCidrBlock: "0.0.0.0/0",
    natGatewayId: natGateway.id,
  });

  [publicSubnetA, publicSubnetB].forEach((subnet, i) => {
    new aws.ec2.RouteTableAssociation(`public-rta-${i}`, {
      subnetId: subnet.id,
      routeTableId: publicRt.id,
    });
  });

  [privateSubnetA, privateSubnetB].forEach((subnet, i) => {
    new aws.ec2.RouteTableAssociation(`private-rta-${i}`, {
      subnetId: subnet.id,
      routeTableId: privateRt.id,
    });
  });

  return {
    vpc,
    publicSubnetA,
    publicSubnetB,
    privateSubnetA,
    privateSubnetB,
  };
}
