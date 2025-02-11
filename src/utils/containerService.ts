import logger from "./logger";
import { ContainerInfo } from "dockerode";
import { getDockerClient } from "./dockerClient";
import fs from "fs";
import { atomicWrite } from "./atomicWrite";
const configPath = "./src/data/dockerConfig.json";
import { AllContainerData, HostConfig } from "../typings/dockerConfig";
import { generateGraphJSON } from "../handlers/graph";
import { WebSocket } from "ws";

export function loadConfig() {
  try {
    if (!fs.existsSync(configPath)) {
      logger.warn(
        `Config file not found. Creating an empty file at ${configPath}`,
      );
      atomicWrite(configPath, JSON.stringify({ hosts: [] }, null, 2));
    }

    const configData = fs.readFileSync(configPath, "utf-8");
    logger.debug("Loaded " + configPath);
    return JSON.parse(configData);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(errorMsg);
    return { hosts: [] };
  }
}

export async function fetchContainersForHost(hostName: string) {
  const config = loadConfig();
  const hostConfig = config.hosts.find((h: HostConfig) => h.name === hostName);

  if (!hostConfig) {
    throw new Error(`Host ${hostName} not found in configuration`);
  }

  try {
    const docker = getDockerClient(hostName);
    const containers: ContainerInfo[] = await docker.listContainers({
      all: true,
    });

    return await Promise.all(
      containers.map(async (container) => {
        try {
          const containerInstance = docker.getContainer(container.Id);
          const [containerInfo, containerStats] = await Promise.all([
            containerInstance.inspect(),
            containerInstance.stats({ stream: false }),
          ]);

          const cpuDelta =
            containerStats.cpu_stats.cpu_usage.total_usage -
            containerStats.precpu_stats.cpu_usage.total_usage;
          const systemCpuDelta =
            containerStats.cpu_stats.system_cpu_usage -
            containerStats.precpu_stats.system_cpu_usage;
          const cpuUsage =
            systemCpuDelta > 0
              ? (cpuDelta / systemCpuDelta) *
                containerStats.cpu_stats.online_cpus
              : 0;

          return {
            name: container.Names[0].replace("/", ""),
            id: container.Id,
            hostName,
            state: container.State,
            cpu_usage: cpuUsage,
            mem_usage: containerStats.memory_stats.usage,
            mem_limit: containerStats.memory_stats.limit,
            net_rx: containerStats.networks?.eth0?.rx_bytes || 0,
            net_tx: containerStats.networks?.eth0?.tx_bytes || 0,
            current_net_rx: containerStats.networks?.eth0?.rx_bytes || 0,
            current_net_tx: containerStats.networks?.eth0?.tx_bytes || 0,
            networkMode: containerInfo.HostConfig.NetworkMode || "unknown",
          };
        } catch (error) {
          logger.error(`Error processing container ${container.Id}: ${error}`);
          return {
            name: container.Names[0].replace("/", ""),
            id: container.Id,
            hostName,
            state: container.State,
            cpu_usage: 0,
            mem_usage: 0,
            mem_limit: 0,
            net_rx: 0,
            net_tx: 0,
            current_net_rx: 0,
            current_net_tx: 0,
            networkMode: "unknown",
          };
        }
      }),
    );
  } catch (error) {
    logger.error(`Error fetching containers for ${hostName}: ${error}`);
    throw error;
  }
}

export async function fetchAllContainers(): Promise<AllContainerData> {
  const config = loadConfig();
  const allContainerData: AllContainerData = {};

  await Promise.all(
    config.hosts.map(async (hostConfig: HostConfig) => {
      try {
        allContainerData[hostConfig.name] = await fetchContainersForHost(
          hostConfig.name,
        );
      } catch (error) {
        allContainerData[hostConfig.name] = {
          error: `Error fetching containers: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    }),
  );

  generateGraphJSON(allContainerData);
  return allContainerData;
}

export async function streamContainerData(ws: WebSocket, hostName: string) {
  try {
    const containers = await fetchContainersForHost(hostName);
    ws.send(JSON.stringify({ type: "containers", data: containers }));

    const docker = getDockerClient(hostName);
    const eventStream = await docker.getEvents();

    // eslint-disable-next-line
    if (!(eventStream instanceof require("stream").Readable)) {
      throw new Error("Failed to get valid event stream");
    }

    const handleData = (chunk: Buffer) => {
      ws.send(
        JSON.stringify({ type: "container-event", data: chunk.toString() }),
      );
    };

    const handleError = (err: Error) => {
      logger.error(`Event stream error for ${hostName}: ${err.message}`);
      ws.close();
    };

    eventStream.on("data", handleData).on("error", handleError);

    const closeHandler = () => {
      eventStream
        .removeListener("data", handleData)
        .removeListener("error", handleError)
        .removeListener("closed", handleError);
      logger.info(`Closed event stream for ${hostName}`);
    };

    ws.on("close", closeHandler);
    ws.on("error", closeHandler);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("Container data error:", message);
    ws.send(
      JSON.stringify({
        error: "Failed to fetch container data",
        details: message,
      }),
    );
    ws.close();
  }
}
