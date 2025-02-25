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
import type { Readable } from "stream";

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
      (socket as any).heartbeat = null; // Add heartbeat reference

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

      // Add heartbeat using WebSocket protocol-level ping
      (socket as any).heartbeat = setInterval(() => {
        if (!(socket as any).isOpen) {
          clearInterval((socket as any).heartbeat);
          return;
        }
        socket.ping(); // Use WebSocket protocol ping
      }, 30000);

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
            if (!(socket as any).isOpen) break;

            logger.debug(
              `Processing container ${containerInfo.Id} on host ${host.name}`,
            );
            const container = docker.getContainer(containerInfo.Id);
            try {
              logger.debug(
                `Starting stats stream for container ${containerInfo.Id} on host ${host.name}`,
              );
              const statsStream = (await container.stats({
                stream: true,
              })) as Readable;
              const splitStream = split2();

              // Store both streams for cleanup
              (socket as any).streams.push({ statsStream, splitStream });

              // Handle stream lifecycle
              statsStream
                .on("close", () => {
                  logger.debug(`Stats stream closed for ${containerInfo.Id}`);
                  splitStream.destroy();
                })
                .on("end", () => {
                  logger.debug(`Stats stream ended for ${containerInfo.Id}`);
                  splitStream.destroy();
                });

              // Process data
              statsStream
                .pipe(splitStream)
                .on("data", (line: string) => {
                  if (socket.readyState !== 1) return; // 1 = OPEN state
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
                    logger.debug(`Parsing data on Socket ${socket.id}`);
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
                  if (socket.readyState === 1) {
                    socket.send(
                      JSON.stringify({
                        hostId: host.name,
                        containerId: containerInfo.Id,
                        error: errResponse.error,
                      }),
                    );
                  }
                  statsStream.destroy();
                });
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
              if (socket.readyState === 1) {
                socket.send(
                  JSON.stringify({
                    hostId: host.name,
                    containerId: containerInfo.Id,
                    error: errResponse.error,
                  }),
                );
              }
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
          if (socket.readyState === 1) {
            socket.send(
              JSON.stringify({
                hostId: host.name,
                error: errResponse.error,
              }),
            );
          }
        }
      }
    },

    message(socket, message) {
      // Handle pong responses
      if (message === "pong") return;
    },

    close(socket, code, reason) {
      // Atomic closure flag
      const wasOpen = (socket as any).isOpen;
      (socket as any).isOpen = false;

      // Immediate heartbeat cleanup
      clearInterval((socket as any).heartbeat);

      // Force-close streams using destructor pattern
      const streams = (socket as any).streams || [];
      streams.forEach(({ statsStream, splitStream }) => {
        try {
          // Immediate pipeline breakdown
          statsStream.unpipe(splitStream);
          statsStream.destroy(new Error("WebSocket closed"));
          splitStream.destroy(new Error("WebSocket closed"));

          // Remove all potential listeners
          statsStream.removeAllListeners();
          splitStream.removeAllListeners();
        } catch (err) {
          logger.error(`Stream cleanup error: ${err}`);
        }
      });

      if (wasOpen) {
        logger.info(
          `Closed WebSocket (${socket.id}) - Code: ${code} - Reason: ${reason}`,
        );
      }
    },
  },
);
