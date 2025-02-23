interface DockerHost {
  name: string;
  url: string;
  poll_interval: number;
}

interface ContainerInfo {
  id: string;
  hostId: string;
  name: string;
  image: string;
  status: string;
  state: string;
  cpuUsage: number;
  memoryUsage: number;
}

interface HostConfig {
  hostId: string;
  dockerVersion: string;
  apiVersion: string;
  os: string;
  architecture: string;
  totalMemory: number;
  totalCPU: number;
}

export type { HostConfig, ContainerInfo, DockerHost };
