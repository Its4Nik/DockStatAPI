import { EventEmitter } from "events";

export interface Plugin {
  name: string;
  onContainerStart?: (containerInfo: any) => void;
  onMetricsReceived?: (metrics: any) => void;
  onLogReceived?: (log: string) => void;
}

export class PluginManager extends EventEmitter {
  private plugins: Map<string, Plugin> = new Map();

  register(plugin: Plugin) {
    this.plugins.set(plugin.name, plugin);
    console.log(`Registered plugin: ${plugin.name}`);
  }

  unregister(name: string) {
    this.plugins.delete(name);
  }

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
