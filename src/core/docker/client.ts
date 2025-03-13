import type { DockerHost } from "~/typings/docker";
import Docker from "dockerode";
import { logger } from "~/core/utils/logger";

async function fileExists(path: string): Promise<boolean> {
  try {
    return await Bun.file(path).exists();
  } catch (error) {
    return false;
  }
}

export const getDockerClient = (host: DockerHost): Docker => {
  try {
    const inputUrl = host.url.includes("://")
      ? host.url
      : `${host.secure ? "https" : "http"}://${host.url}`;
    const parsedUrl = new URL(inputUrl);
    const hostAddress = parsedUrl.hostname;
    let port = parsedUrl.port
      ? parseInt(parsedUrl.port)
      : host.secure
        ? 2376
        : 2375;

    if (isNaN(port) || port < 1 || port > 65535) {
      throw new Error("Invalid port number in Docker host URL");
    }

    return new Docker({
      protocol: host.secure ? "https" : "http",
      host: hostAddress,
      port,
      version: "v1.41",
      // TODO: Add TLS configuration if needed
    });
  } catch (error) {
    logger.error("Invalid Docker host URL configuration:", error);
    throw new Error("Invalid Docker host configuration");
  }
};

export const stackClient = async (): Promise<Docker> => {
  const socketPath = "/var/run/docker.sock";
  try {
    if (!(await fileExists(socketPath))) {
      throw new Error("Docker socket not found at " + socketPath);
    }

    const docker = new Docker({
      socketPath,
    });

    const pingTimeout = 2000;
    await Promise.race([
      docker.ping(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Ping timed out")), pingTimeout),
      ),
    ]);

    return docker;
  } catch (error) {
    logger.error(
      `Could not create Docker client for "${socketPath}" - ${error}`,
    );
    throw new Error("Failed to create Docker client for local Docker socket");
  }
};
