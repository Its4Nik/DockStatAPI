import Docker from "dockerode";
import { dbFunctions } from "~/core/database/repository";
import { getDockerClient } from "~/core/docker/client";
import {
  calculateCpuPercent,
  calculateMemoryUsage,
} from "~/core/utils/calculations";
import { logger } from "~/core/utils/logger";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import type { ContainerInfo, DockerHost, HostStats } from "~/typings/docker";
import type { DockerInfo } from "~/typings/dockerode";

export const dockerStatsProcedure = router({
  getContainers: publicProcedure.query(async () => {
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
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Docker host connection failed",
                cause: pingError,
              });
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
                          reject(
                            new TRPCError({
                              code: "INTERNAL_SERVER_ERROR",
                              message: "Error fetching container stats",
                              cause: error,
                            })
                          );
                        }
                        if (!stats) {
                          reject(
                            new TRPCError({
                              code: "NOT_FOUND",
                              message: "No stats available",
                            })
                          );
                        }
                        resolve(stats as Docker.ContainerStats);
                      });
                    }
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
                    "Error fetching container stats",
                    containerError
                  );
                }
              })
            );
            logger.debug(`Fetched stats for ${host.name}`);
          } catch (hostError) {
            logger.error("Error fetching containers for host", hostError);
          }
        })
      );

      logger.debug("Fetched all containers across all hosts");
      return { containers };
    } catch (error) {
      logger.error("Error fetching containers", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve containers",
        cause: error,
      });
    }
  }),

  getHostStats: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const hosts = dbFunctions.getDockerHosts() as DockerHost[];
        const host = hosts.find((h) => h.name === input.id);

        if (!host) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Host (${input.id}) not found`,
          });
        }

        const docker = getDockerClient(host);
        const info: DockerInfo = await docker.info();

        const config: HostStats = {
          hostId: host.name,
          dockerVersion: info.ServerVersion,
          apiVersion: info.Driver,
          os: info.OperatingSystem,
          architecture: info.Architecture,
          totalMemory: info.MemTotal,
          totalCPU: info.NCPU,
          labels: info.Labels,
          images: info.Images,
          containers: info.Containers,
          containersPaused: info.ContainersPaused,
          containersRunning: info.ContainersRunning,
          containersStopped: info.ContainersStopped,
        };

        logger.debug(`Fetched config for ${host.name}`);
        return config;
      } catch (error) {
        logger.error("Error fetching host stats", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve host config",
          cause: error,
        });
      }
    }),
});
