import { Elysia, t } from "elysia";
import Docker from "dockerode";
import { dbFunctions } from "~/core/database/repository";
import { logger } from "~/core/utils/logger";
import type { HostConfig, DockerHost, ContainerInfo } from "~/typings/docker";

interface WsData {
  params: any;
  interval?: ReturnType<typeof setInterval>;
  statsStream?: any;
}

const getDockerClient = (hostUrl: string): Docker => {
  try {
    const [host, port] = hostUrl.includes("://")
      ? hostUrl.split("://")[1].split(":")
      : hostUrl.split(":");

    const protocol = hostUrl.startsWith("https://") ? "https" : "http";

    return new Docker({
      protocol,
      host,
      port: port ? parseInt(port) : protocol === "https" ? 2376 : 2375,
      version: "v1.41",
      // TODO: Add TLS configuration if needed
    });
  } catch (error) {
    logger.error("Invalid Docker host URL configuration,", error);
    throw new Error("Invalid Docker host configuration");
  }
};

export const dockerStatsRoutes = new Elysia({ prefix: "/docker" })
  .get("/containers", async ({ set }) => {
    try {
      const hosts = dbFunctions.getDockerHosts() as DockerHost[];
      const containers: ContainerInfo[] = [];

      await Promise.all(
        hosts.map(async (host) => {
          try {
            const docker = getDockerClient(host.url);
            try {
              await docker.ping();
            } catch (pingError) {
              logger.error("Docker host connection failed,", pingError);
              return;
            }

            const hostContainers = await docker.listContainers({ all: true });

            await Promise.all(
              hostContainers.map(async (containerInfo) => {
                try {
                  const container = docker.getContainer(containerInfo.Id);
                  const stats = await new Promise<Docker.ContainerStats>(
                    (resolve, reject) => {
                      container.stats({ stream: false }, (err, stats) => {
                        if (err) {
                          logger.error("An error occured,", err);
                          return reject(err);
                        }
                        if (!stats) {
                          logger.error("No stats available");
                          return reject(new Error("No stats available"));
                        }
                        resolve(stats);
                      });
                    },
                  );

                  containers.push({
                    id: containerInfo.Id,
                    hostId: host.name,
                    name: containerInfo.Names[0].replace(/^\//, ""),
                    image: containerInfo.Image,
                    status: containerInfo.Status,
                    state: containerInfo.State,
                    cpuUsage: calculateCpuPercent(stats),
                    memoryUsage: calculateMemoryUsage(stats),
                  });
                } catch (containerError) {
                  logger.error(
                    "Error fetching container stats,",
                    containerError,
                  );
                }
              }),
            );
            logger.debug(`Fetched stats for ${host.name}`);
          } catch (hostError) {
            logger.error("Error fetching containers for host,", hostError);
          }
        }),
      );

      set.headers["Content-Type"] = "application/json";
      return { containers };
    } catch (error) {
      set.status = 500;
      logger.error("Failed to retrieve containers,", error);
      return { error: "Failed to retrieve containers" };
    }
  })

  .get("/hosts/:id/config", async ({ params, set }) => {
    try {
      const hosts = dbFunctions.getDockerHosts() as DockerHost[];
      const host = hosts.find((h) => h.name === params.id);

      if (!host) {
        set.status = 404;
        logger.error(`Host (${host}) not found`);
        return { error: "Host not found" };
      }

      const docker = getDockerClient(host.url);
      const info = await docker.info();

      const config: HostConfig = {
        hostId: host.name,
        dockerVersion: info.ServerVersion,
        apiVersion: info.Driver,
        os: info.OperatingSystem,
        architecture: info.Architecture,
        totalMemory: info.MemTotal,
        totalCPU: info.NCPU,
      };

      set.headers["Content-Type"] = "application/json";
      logger.debug(`Fetched config for ${host.name}`);
      return config;
    } catch (error) {
      set.status = 500;
      logger.error("Failed to retrieve host config,", error);
      return { error: "Failed to retrieve host config" };
    }
  })

  .ws("/hosts/:id/stats", {
    message(ws, message) {
      ws.send(message);
    },
    async open(ws) {
      try {
        const hosts = dbFunctions.getDockerHosts() as DockerHost[];
        const host = hosts.find((h) => h.name === ws.data.params.id);

        if (!host) {
          ws.close(1008, "Host not found");
          logger.error(`Host (${host}) not found`);
          return;
        }

        const docker = getDockerClient(host.url);
        const interval = setInterval(async () => {
          try {
            const info = await docker.info();
            ws.send({
              timestamp: Date.now(),
              memoryUsage: info.MemTotal - info.MemFree,
              cpuUsage: info.NanoCPUs,
              containerCount: info.ContainersRunning,
            });
            logger.debug(`Fetched host (${host.name}) config`);
          } catch (error) {
            logger.error("Error fetching host stats,", error);
          }
        }, 5000);
        (ws.data as WsData).interval = interval;
      } catch (error) {
        logger.error("WebSocket connection failed,", error);
        ws.close(1011, "Internal error");
      }
    },
    close(ws) {
      const data = ws.data as WsData;
      if (data.interval) {
        clearInterval(data.interval);
      }
    },
  })

  .ws("/containers/:hostId/:containerId/metrics", {
    message(ws, message) {
      ws.send(message);
    },
    async open(ws) {
      try {
        const hosts = dbFunctions.getDockerHosts() as DockerHost[];
        const host = hosts.find((h) => h.name === ws.data.params.hostId);

        if (!host) {
          ws.close(1008, "Host not found");
          logger.error(`Host (${host}) not found`);
          return;
        }

        const docker = getDockerClient(host.url);
        const container = docker.getContainer(ws.data.params.containerId);
        const statsStream = await container.stats({ stream: true });

        statsStream.on("data", (data: Buffer) => {
          const stats = JSON.parse(data.toString());
          ws.send({
            cpu: calculateCpuPercent(stats),
            memory: calculateMemoryUsage(stats),
            timestamp: Date.now(),
          });
        });

        statsStream.on("error", (error) => {
          logger.error("Container stats stream error,", error);
          ws.close(1011, "Stats stream error");
        });

        (ws.data as WsData).statsStream = statsStream;
      } catch (error) {
        logger.error("WebSocket connection failed,", error);
        ws.close(1011, "Internal error");
      }
    },
    close(ws) {
      const data = ws.data as WsData;
      if (data.statsStream) {
        data.statsStream.destroy();
      }
    },
  });

const calculateCpuPercent = (stats: Docker.ContainerStats): number => {
  const cpuDelta =
    stats.cpu_stats.cpu_usage.total_usage -
    stats.precpu_stats.cpu_usage.total_usage;
  const systemDelta =
    stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
  return (cpuDelta / systemDelta) * 100;
};

const calculateMemoryUsage = (stats: Docker.ContainerStats): number => {
  return (stats.memory_stats.usage / stats.memory_stats.limit) * 100;
};
