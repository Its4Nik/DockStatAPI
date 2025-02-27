import { pluginManager } from "./plugin-manager";

export const pluginAction = {
  containerStart(containerInfo: any) {
    pluginManager.handleContainerStart(containerInfo);
  },
  metricsReceived(metrics: any) {
    pluginManager.handleMetrics(metrics);
  },
};
