export interface DockerComposeFile {
  services: Record<string, ServiceDefinition>;
  networks?: Record<string, NetworkDefinition>;
  volumes?: Record<string, VolumeDefinition>;
}

export interface ServiceDefinition {
  image?: string;
  build?: BuildDefinition;
  container_name?: string;
  command?: string | string[];
  environment?: Record<string, string>;
  ports?: string[] | PortMapping[];
  volumes?: string[];
  networks?: string[];
  restart?: string;
  depends_on?: string[];
  deploy?: DeployDefinition;
}

export interface BuildDefinition {
  context: string;
  dockerfile?: string;
  args?: Record<string, string>;
  cache_from?: string[];
  labels?: Record<string, string>;
  target?: string;
}

export interface PortMapping {
  target: number;
  published: number;
  protocol?: "tcp" | "udp";
  mode?: "host" | "ingress";
}

export interface DeployDefinition {
  replicas?: number;
  resources?: ResourcesDefinition;
  restart_policy?: RestartPolicyDefinition;
  labels?: Record<string, string>;
  update_config?: UpdateConfigDefinition;
}

export interface ResourcesDefinition {
  limits?: ResourceLimits;
  reservations?: ResourceReservations;
}

export interface ResourceLimits {
  cpus?: string;
  memory?: string;
}

export interface ResourceReservations {
  cpus?: string;
  memory?: string;
}

export interface RestartPolicyDefinition {
  condition?: "none" | "on-failure" | "any";
  delay?: string;
  max_attempts?: number;
  window?: string;
}

export interface UpdateConfigDefinition {
  parallelism?: number;
  delay?: string;
  failure_action?: "continue" | "pause";
  monitor?: string;
  max_failure_ratio?: number;
  order?: "start-first" | "stop-first";
}

export interface NetworkDefinition {
  driver?: string;
  driver_opts?: Record<string, string>;
  attachable?: boolean;
  external?: boolean;
  internal?: boolean;
  labels?: Record<string, string>;
}

export interface VolumeDefinition {
  driver?: string;
  driver_opts?: Record<string, string>;
  external?: boolean;
  labels?: Record<string, string>;
  name?: string;
}
