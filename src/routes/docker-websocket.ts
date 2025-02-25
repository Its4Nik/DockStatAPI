import type { StatusMap } from "elysia";
import { Elysia } from "elysia";
import type { HTTPHeaders } from "elysia/dist/types";
import { dbFunctions } from "~/core/database/repository";
import { getDockerClient } from "~/core/docker/client";
import {
  calculateCpuPercent,
  calculateMemoryUsage,
} from "~/core/utils/calculations";
import { logger } from "~/core/utils/logger";
import { responseHandler } from "~/core/utils/respone-handler";
import type { DockerHost } from "~/typings/docker";
import split2 from "split2";

const set: { headers: HTTPHeaders; status?: number | keyof StatusMap } = {
  headers: {},
};

export const dockerWebsocketRoutes = new Elysia({ prefix: "/docker" }).ws(
  "/stats",
  {
    async open(socket) {
      socket.send(JSON.stringify({ message: "Connection established" }));
      let hosts: DockerHost[];

      // Track if the WebSocket is open
      (socket as any).isOpen = true;
      (socket as any).streams = [];

      logger.debug(`Opened WebSocket (${socket.id})`);

      try {
        hosts = dbFunctions.getDockerHosts();
        logger.debug(
          `Retrieved ${hosts.length} docker host(s) from the database`,
        );
      } catch (error: unknown) {
        const errResponse = responseHandler.error(
          set,
          (error as Error).message,
          "Failed to retrieve Docker hosts",
          500,
        );
        logger.error(
          `Error retrieving Docker hosts: ${(error as Error).message}`,
        );
        socket.send(JSON.stringify(errResponse));
        return;
      }

      for (const host of hosts) {
        if (!(socket as any).isOpen) break;

        logger.debug(`Processing host: ${host.name}`);

        try {
          const docker = getDockerClient(host);
          await docker.ping();
          logger.debug(`Ping successful for host: ${host.name}`);
          logger.debug(`Listing containers for host: ${host.name}`);
          const containers = await docker.listContainers();
          logger.debug(
            `Found ${containers.length} container(s) on host ${host.name}`,
          );

          for (const containerInfo of containers) {
            // Check if WebSocket is still open before processing each container
            if (!(socket as any).isOpen) break;

            logger.debug(
              `Processing container ${containerInfo.Id} on host ${host.name}`,
            );
            const container = docker.getContainer(containerInfo.Id);
            try {
              logger.debug(
                `Starting stats stream for container ${containerInfo.Id} on host ${host.name}`,
              );
              const statsStream = await container.stats({ stream: true });

              // Immediately destroy stream if WebSocket closed while setting up
              if (!(socket as any).isOpen) {
                statsStream.pause();
                statsStream.unpipe();
                continue;
              }

              // Save stream for cleanup on socket close
              (socket as any).streams.push(statsStream);

              // Use split2 to process NDJSON lines
              statsStream
                .pipe(split2())
                .on("data", (line: string) => {
                  if (!line) return;
                  try {
                    const stats = JSON.parse(line);
                    const cpuUsage = calculateCpuPercent(stats);
                    const memoryUsage = calculateMemoryUsage(stats);

                    const data = {
                      id: containerInfo.Id,
                      hostId: host.name,
                      name: containerInfo.Names[0].replace(/^\//, ""),
                      image: containerInfo.Image,
                      status: containerInfo.Status,
                      state: containerInfo.State,
                      cpuUsage,
                      memoryUsage,
                    };
                    socket.send(JSON.stringify(data));
                    logger.debug(`Parsing data`);
                  } catch (parseErr: any) {
                    logger.error(
                      `Failed to parse stats for container ${containerInfo.Id} on host ${host.name}: ${parseErr.message}`,
                    );
                  }
                })
                .on("error", (err: Error) => {
                  logger.error(
                    `Stats stream error for container ${containerInfo.Id} on host ${host.name}: ${err.message}`,
                  );
                  const errResponse = responseHandler.error(
                    set,
                    err.message,
                    `Stats stream error for container ${containerInfo.Id}`,
                    500,
                  );
                  socket.send(
                    JSON.stringify({
                      hostId: host.name,
                      containerId: containerInfo.Id,
                      error: errResponse.error,
                    }),
                  );
                  statsStream.removeAllListeners();
                });

              statsStream.resume();
            } catch (streamErr: any) {
              logger.error(
                `Failed to start stats stream for container ${containerInfo.Id} on host ${host.name}: ${streamErr.message}`,
              );
              const errResponse = responseHandler.error(
                set,
                streamErr.message,
                `Failed to start stats stream for container ${containerInfo.Id}`,
                500,
              );
              socket.send(
                JSON.stringify({
                  hostId: host.name,
                  containerId: containerInfo.Id,
                  error: errResponse.error,
                }),
              );
            }
          }
        } catch (err: any) {
          logger.error(
            `Failed to list containers for host ${host.name}: ${err.message}`,
          );
          const errResponse = responseHandler.error(
            set,
            err.message,
            `Failed to list containers for host ${host.name}`,
            500,
          );
          socket.send(
            JSON.stringify({
              hostId: host.name,
              error: errResponse.error,
            }),
          );
        }
      }
    },

    close(socket, code, reason) {
      //socket.isOpen = false;

      socket.close(1000);
      //const streams = (socket as any).streams;
      //if (streams?.length) {
      //  streams.forEach((stream: NodeJS.ReadableStream) => {
      //    try {
      //      logger.debug(`Destroying stats stream`);
      //      stream.pause();
      //      stream.unpipe();
      //    } catch (err) {
      //      logger.error(`Error destroying stream: ${err}`);
      //    }
      //  });
      //  (socket as any).streams = [];
      //}

      logger.info(
        `Closed WebSocket (${socket.id}) - Code: ${code} - Reason: ${reason}`,
      );
    },
  },
);
