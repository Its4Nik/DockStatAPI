import type { DockerHost } from "~/typings/docker";
import Docker from "dockerode";
import { logger } from "~/core/utils/logger";

export const getDockerClient = (host: DockerHost): Docker => {
  try {
    const [hostAddress, port] = host.url.split(":");
    const protocol = host.secure ? "https" : "http";
    return new Docker({
      protocol,
      host: hostAddress,
      port: port ? parseInt(port) : host.secure ? 2376 : 2375,
      version: "v1.41",
      // TODO: Add TLS configuration if needed
    });
  } catch (error) {
    logger.error("Invalid Docker host URL configuration,", error);
    throw new Error("Invalid Docker host configuration");
  }
};
