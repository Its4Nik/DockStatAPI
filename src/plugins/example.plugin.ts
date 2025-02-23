import { Plugin } from "~/core/plugins/plugin-manager";

export default {
  name: "example-plugin",
  onContainerStart: (containerInfo) => {
    console.log(`Container started: ${containerInfo.id}`);
  },
  onMetricsReceived: (metrics) => {
    console.log("Received metrics:", metrics);
  },
} satisfies Plugin;
