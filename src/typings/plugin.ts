import { ContainerInfo } from "~/typings/docker";
import { HostStats } from "~/typings/docker";

interface Plugin {
  name: string;

  // Container lifecycle hooks
  onContainerStart?: (containerInfo: ContainerInfo) => void;
  onContainerStop?: (containerInfo: ContainerInfo) => void;
  onContainerExit?: (containerInfo: ContainerInfo) => void;
  onContainerCreate?: (containerInfo: ContainerInfo) => void;
  onContainerDestroy?: (containerInfo: ContainerInfo) => void;
  onContainerPause?: (containerInfo: ContainerInfo) => void;
  onContainerUnpause?: (containerInfo: ContainerInfo) => void;
  onContainerRestart?: (containerInfo: ContainerInfo) => void;
  onContainerUpdate?: (containerInfo: ContainerInfo) => void;
  onContainerRename?: (containerInfo: ContainerInfo) => void;
  onContainerHealthStatus?: (containerInfo: ContainerInfo) => void;

  // Host lifecycle hooks
  onHostUnreachable?: (HostStats: HostStats) => void;
  onHostReachableAgain?: (HostStats: HostStats) => void;
}

export type { Plugin };
