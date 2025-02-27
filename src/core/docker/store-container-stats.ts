import { getDockerClient } from "~/core/docker/client";
import { dbFunctions } from "~/core/database/repository";
import Docker from "dockerode";
import {
  calculateCpuPercent,
  calculateMemoryUsage,
} from "~/core/utils/calculations";

async function storeContainerData() {
  try {
    // Stage 1: getting all docker hosts and mapping over them
    const hosts = dbFunctions.getDockerHosts();

    hosts.map(async (host) => {
      try {
        // Stage 2: getting the Docker client and pinging to test the connection
        const docker = getDockerClient(host);

        try {
          await docker.ping();
        } catch (error) {
          throw new Error(
            `Error while pinging docker host: ${error as string}`,
          );
        }

        const containers = await docker.listContainers({ all: true });

        await Promise.all(
          containers.map(async (containerInfo) => {
            try {
              const container = docker.getContainer(containerInfo.Id);
              const stats = await new Promise<Docker.ContainerStats>(
                (resolve, reject) => {
                  container.stats({ stream: false }, (error, stats) => {
                    if (error) {
                      return reject(
                        new Error(`An Error occured: ${error as string}`),
                      );
                    }
                    if (!stats) {
                      return reject(
                        new Error(`No Stats available: ${error as string}`),
                      );
                    }
                    resolve(stats);
                  });
                },
              );

              dbFunctions.addContainerStats(
                containerInfo.Id,
                host.name,
                containerInfo.Names[0].replace(/^\//, ""),
                containerInfo.Image,
                containerInfo.Status,
                containerInfo.State,
                calculateCpuPercent(stats),
                calculateMemoryUsage(stats),
              );
            } catch (error) {
              throw new Error(`An error occurred: ${error as string}`);
            }
          }),
        );
      } catch (error: unknown) {
        throw new Error(
          `Error while getting docker client: ${error as string}`,
        );
      }
    });
  } catch (error: unknown) {
    throw new Error("Error while XXX");
  }
}

export default storeContainerData;
