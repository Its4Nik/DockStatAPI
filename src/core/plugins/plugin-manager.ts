import { EventEmitter } from "events";
import { logger } from "../utils/logger";
import type { Plugin } from "~/typings/plugin";
import type { ContainerInfo, HostStats } from "~/typings/docker";

export class PluginManager extends EventEmitter {
  private plugins: Map<string, Plugin> = new Map();

  register(plugin: Plugin) {
    try {
      this.plugins.set(plugin.name, plugin);
      logger.debug(`Registered plugin: ${plugin.name}`);
    } catch (error) {
      logger.error(
        `Registering plugin ${plugin.name} failed: ${error as string}`
      );
    }
  }

  unregister(name: string) {
    this.plugins.delete(name);
  }

  // Trigger plugin flows:
  handleContainerStop(containerInfo: ContainerInfo) {
    this.plugins.forEach((plugin) => {
      plugin.onContainerStop?.(containerInfo);
    });
  }

  handleContainerStart(containerInfo: ContainerInfo) {
    this.plugins.forEach((plugin) => {
      plugin.onContainerStart?.(containerInfo);
    });
  }

  handleContainerExit(containerInfo: ContainerInfo) {
    this.plugins.forEach((plugin) => {
      plugin.onContainerExit?.(containerInfo);
    });
  }

  handleContainerCreate(containerInfo: ContainerInfo) {
    this.plugins.forEach((plugin) => {
      plugin.onContainerCreate?.(containerInfo);
    });
  }

  handleContainerDestroy(containerInfo: ContainerInfo) {
    this.plugins.forEach((plugin) => {
      plugin.onContainerDestroy?.(containerInfo);
    });
  }

  handleContainerPause(containerInfo: ContainerInfo) {
    this.plugins.forEach((plugin) => {
      plugin.onContainerPause?.(containerInfo);
    });
  }

  handleContainerUnpause(containerInfo: ContainerInfo) {
    this.plugins.forEach((plugin) => {
      plugin.onContainerUnpause?.(containerInfo);
    });
  }

  handleContainerRestart(containerInfo: ContainerInfo) {
    this.plugins.forEach((plugin) => {
      plugin.onContainerRestart?.(containerInfo);
    });
  }

  handleContainerUpdate(containerInfo: ContainerInfo) {
    this.plugins.forEach((plugin) => {
      plugin.onContainerUpdate?.(containerInfo);
    });
  }

  handleContainerRename(containerInfo: ContainerInfo) {
    this.plugins.forEach((plugin) => {
      plugin.onContainerRename?.(containerInfo);
    });
  }

  handleContainerHealthStatus(containerInfo: ContainerInfo) {
    this.plugins.forEach((plugin) => {
      plugin.onContainerHealthStatus?.(containerInfo);
    });
  }

  handleHostUnreachable(HostStats: HostStats) {
    this.plugins.forEach((plugin) => {
      plugin.onHostUnreachable?.(HostStats);
    });
  }

  handleHostReachableAgain(HostStats: HostStats) {
    this.plugins.forEach((plugin) => {
      plugin.onHostReachableAgain?.(HostStats);
    });
  }
}

export const pluginManager = new PluginManager();
