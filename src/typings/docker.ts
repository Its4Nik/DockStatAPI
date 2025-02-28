interface DockerHost {
  name: string;
  url: string;
  secure: boolean;
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

interface HostStats {
  hostId: string;
  dockerVersion: string;
  apiVersion: string;
  os: string;
  architecture: string;
  totalMemory: number;
  totalCPU: number;
  labels: string[];
  containers: number;
  containersRunning: number;
  containersStopped: number;
  containersPaused: number;
  images: number;
}

export type { HostStats, ContainerInfo, DockerHost };
