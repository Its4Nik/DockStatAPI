import Docker from "dockerode";
import { Elysia } from "elysia";
import { dbFunctions } from "~/core/database/repository";
import { getDockerClient } from "~/core/docker/client";
import {
  calculateCpuPercent,
  calculateMemoryUsage,
} from "~/core/utils/calculations";
import { logger } from "~/core/utils/logger";
import { responseHandler } from "~/core/utils/respone-handler";
import type { ContainerInfo, DockerHost, HostConfig } from "~/typings/docker";

export const dockerStatsRoutes = new Elysia({ prefix: "/docker" })
  .get(
    "/containers",
    async ({ set }) => {
      try {
        const hosts = dbFunctions.getDockerHosts() as DockerHost[];
        const containers: ContainerInfo[] = [];

        await Promise.all(
          hosts.map(async (host) => {
            try {
              const docker = getDockerClient(host);
              try {
                await docker.ping();
              } catch (pingError) {
                return responseHandler.error(
                  set,
                  pingError as string,
                  "Docker host connection failed",
                );
              }

              const hostContainers = await docker.listContainers({ all: true });

              await Promise.all(
                hostContainers.map(async (containerInfo) => {
                  try {
                    const container = docker.getContainer(containerInfo.Id);
                    const stats = await new Promise<Docker.ContainerStats>(
                      (resolve, reject) => {
                        container.stats({ stream: false }, (error, stats) => {
                          if (error) {
                            return responseHandler.reject(
                              set,
                              reject,
                              "An error occurred",
                              error,
                            );
                          }
                          if (!stats) {
                            return responseHandler.reject(
                              set,
                              reject,
                              "No stats available",
                            );
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
        logger.debug("Fetched all containers across all hosts");
        return { containers };
      } catch (error) {
        return responseHandler.error(
          set,
          error as string,
          "Failed to retrieve containers",
        );
      }
    },
    {
      detail: {
        tags: ["Statistics"],
      },
    },
  )

  .get(
    "/hosts/:id",
    async ({ params, set }) => {
      try {
        const hosts = dbFunctions.getDockerHosts() as DockerHost[];
        const host = hosts.find((h) => h.name === params.id);

        if (!host) {
          return responseHandler.simple_error(
            set,
            `Host (${params.id}) not found`,
          );
        }

        const docker = getDockerClient(host);
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
        return responseHandler.error(
          set,
          error as string,
          "Failed to retrieve host config",
        );
      }
    },
    {
      detail: {
        tags: ["Statistics"],
      },
    },
  );
