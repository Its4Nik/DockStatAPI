import type { Plugin } from "~/typings/plugin";
import type { ContainerInfo } from "~/typings/docker";
import type { HostStats } from "~/typings/docker";
import { logger } from "~/core/utils/logger";

const ExamplePlugin: Plugin = {
  name: "Example Plugin",
  async onContainerStart(containerInfo: ContainerInfo) {},
  async onContainerStop(containerInfo: ContainerInfo) {},
  async onContainerExit(containerInfo: ContainerInfo) {},
  async onContainerCreate(containerInfo: ContainerInfo) {},
  async onContainerDestroy(containerInfo: ContainerInfo) {},
  async onContainerPause(containerInfo: ContainerInfo) {},
  async onContainerUnpause(containerInfo: ContainerInfo) {},
  async onContainerRestart(containerInfo: ContainerInfo) {},
  async onContainerUpdate(containerInfo: ContainerInfo) {},
  async onContainerRename(containerInfo: ContainerInfo) {},
  async onContainerHealthStatus(containerInfo: ContainerInfo) {},
  async onHostUnreachable(HostStats: HostStats) {},
  async onHostReachableAgain(HostStats: HostStats) {},
} satisfies Plugin;

export default ExamplePlugin;
