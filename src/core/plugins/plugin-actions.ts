import { pluginManager } from "./plugin-manager";

export const pluginAction = {
  containerStart(containerInfo: any) {
    pluginManager.handleContainerStart(containerInfo);
  },
};
