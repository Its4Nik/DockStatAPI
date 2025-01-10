import logger from "./logger";
import { ContainerInfo, ContainerStats, ContainerInspectInfo } from "dockerode";
import getDockerClient from "./dockerClient";
import fs from "fs";
import { atomicWrite } from "./atomicWrite";
const configPath = "./src/data/dockerConfig.json";
import { AllContainerData, HostConfig } from "../typings/dockerConfig";
import { generateGraphFiles } from "../handlers/graph";

function loadConfig() {
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
    logger.error(`Failed to load config: ${(error as Error).message}`);
    return null;
  }
}

async function fetchAllContainers(): Promise<AllContainerData> {
  const config = loadConfig();
  if (!config || !config.hosts) {
    logger.error("Invalid or missing host configuration.");
    return {};
  }

  const allContainerData: AllContainerData = {};

  for (const hostConfig of config.hosts as HostConfig[]) {
    const hostName = hostConfig.name;
    try {
      const docker = getDockerClient(hostName);
      logger.debug(`Now processing: ${hostName}`);
      const containers: ContainerInfo[] = await docker.listContainers({
        all: true,
      });

      allContainerData[hostName] = await Promise.all(
        containers.map(async (container) => {
          try {
            const containerInstance = docker.getContainer(container.Id);
            const containerInfo: ContainerInspectInfo =
              await containerInstance.inspect();
            const containerStats: ContainerStats =
              await containerInstance.stats({ stream: false });

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
              cpu_usage: cpuUsage * 1000000000,
              mem_usage: containerStats.memory_stats.usage,
              mem_limit: containerStats.memory_stats.limit,
              net_rx: containerStats.networks?.eth0?.rx_bytes || 0,
              net_tx: containerStats.networks?.eth0?.tx_bytes || 0,
              current_net_rx: containerStats.networks?.eth0?.rx_bytes || 0,
              current_net_tx: containerStats.networks?.eth0?.tx_bytes || 0,
              networkMode: containerInfo.HostConfig.NetworkMode || "unknown",
            };
          } catch (containerError: unknown) {
            logger.error(
              `Error fetching details for container ID: ${container.Id} on host: ${hostName} - ${(containerError as Error).message}`,
            );
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
    } catch (error: unknown) {
      logger.error(
        `Error fetching containers for host: ${hostName} - ${(error as Error).message}. Stack: ${(error as Error).stack}`,
      );
      allContainerData[hostName] = {
        error: `Error fetching containers: ${(error as Error).message}`,
      };
    }
  }

  generateGraphFiles(allContainerData);
  return allContainerData;
}

export default fetchAllContainers;
