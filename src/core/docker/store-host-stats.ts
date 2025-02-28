import { logger } from "~/core/utils/logger";
import { dbFunctions } from "~/core/database/repository";
import { DockerHost, HostStats } from "~/typings/docker";
import { getDockerClient } from "~/core/docker/client";
import { DockerInfo } from "~/typings/dockerode";

async function storeHostData() {
  try {
    const hosts = dbFunctions.getDockerHosts() as DockerHost[];

    await Promise.all(
      hosts.map(async (host) => {
        const docker = getDockerClient(host);

        try {
          await docker.ping();
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : String(error);
          throw new Error(
            `Failed to ping docker host "${host.name}": ${errMsg}`,
          );
        }

        let hostStats: DockerInfo;
        let stats: HostStats;
        try {
          hostStats = await docker.info();
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : String(error);
          throw new Error(
            `Failed to fetch stats for host "${host.name}": ${errMsg}`,
          );
        }

        try {
          const stats: HostStats = {
            hostId: host.name,
            dockerVersion: hostStats.ServerVersion,
            apiVersion: hostStats.Driver,
            os: hostStats.OperatingSystem,
            architecture: hostStats.Architecture,
            totalMemory: hostStats.MemTotal,
            totalCPU: hostStats.NCPU,
            labels: hostStats.Labels,
            images: hostStats.Images,
            containers: hostStats.Containers,
            containersPaused: hostStats.ContainersPaused,
            containersRunning: hostStats.ContainersRunning,
            containersStopped: hostStats.ContainersStopped,
          };

          dbFunctions.updateHostStats(stats);
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : String(error);
          throw new Error(
            `Failed to store stats for host "${host.name}": ${errMsg}`,
          );
        }
      }),
    );
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logger.error(`storeHostData failed: ${errMsg}`);
    throw new Error(`Failed to store host data: ${errMsg}`);
  }
}

export default storeHostData;
