interface HighAvailabilityConfig {
  active: boolean;
  master: boolean;
  nodes: string[];
}

interface Node {
  ip: string;
  port: number;
}

interface HaNodeConfig {
  master: string;
}

interface NodeCache {
  [nodes: string]: Node;
}

export { HighAvailabilityConfig, Node, HaNodeConfig, NodeCache };
