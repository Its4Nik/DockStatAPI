import WebSocket from "ws";
import { pluginManager } from "~/core/plugins/plugin-manager";
import { dbFunctions } from "~/core/database/repository";
import { logger } from "~/core/utils/logger";

export class DockerHostManager {
  public connections = new Map<string, WebSocket>();

  async connect(hostId: string, url: string) {
    const ws = new WebSocket(url);

    ws.on("open", () => {
      this.connections.set(hostId, ws);
      logger.info(`Opened connection to ${hostId}`);
    });

    ws.on("message", (data) => {
      this.handleData(hostId, JSON.parse(data.toString()));
    });

    ws.on("close", () => {
      this.connections.delete(hostId);
      logger.info(`Disconnected from Docker host ${hostId}`);
    });
  }

  private handleData(hostId: string, data: any) {
    dbFunctions.insertMetric(hostId, data);

    if (data.event === "container_start") {
      pluginManager.handleContainerStart(data.container);
    }

    pluginManager.handleMetrics(data);
  }
}

export const dockerHostManager = new DockerHostManager();
