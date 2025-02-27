import { EventEmitter } from "events";
import { logger } from "../utils/logger";

export interface Plugin {
  name: string;
  onContainerStart?: (containerInfo: any) => void;
  onMetricsReceived?: (metrics: any) => void;
  onLogReceived?: (log: string) => void;
}

export class PluginManager extends EventEmitter {
  private plugins: Map<string, Plugin> = new Map();

  register(plugin: Plugin) {
    try {
      this.plugins.set(plugin.name, plugin);
      logger.debug(`Registered plugin: ${plugin.name}`);
    } catch (error) {
      logger.error(
        `Registering plugin ${plugin.name} failed: ${error as string}`,
      );
    }
  }

  unregister(name: string) {
    this.plugins.delete(name);
  }

  // Trigger plugin flows:

  handleContainerStart(containerInfo: any) {
    this.plugins.forEach((plugin) => {
      plugin.onContainerStart?.(containerInfo);
    });
  }

  handleMetrics(metrics: any) {
    this.plugins.forEach((plugin) => {
      plugin.onMetricsReceived?.(metrics);
    });
  }
}

export const pluginManager = new PluginManager();
