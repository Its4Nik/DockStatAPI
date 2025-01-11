import Docker from "dockerode";
import fs from "fs";
import logger from "./logger";

import { dockerConfig, target } from "../typings/dockerConfig";

function loadDockerConfig(): dockerConfig {
  const configPath = "./src/data/dockerConfig.json";
  try {
    const rawData = fs.readFileSync(configPath, "utf-8");
    logger.debug("Refreshed DockerConfig.json");
    return JSON.parse(rawData) as dockerConfig;
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }
}

function createDockerClient(hostConfig: target): Docker {
  logger.info(
    `Creating Docker client for host: ${hostConfig.url} on port: ${hostConfig.port || 2375}`,
  );
  return new Docker({
    host: hostConfig.url,
    port: hostConfig.port || 2375,
    protocol: "http",
  });
}

const getDockerClient = (hostName: string): Docker => {
  logger.debug(`Getting Docker Client for ${hostName}`);
  const config = loadDockerConfig();
  const hostConfig = config.hosts.find((host) => host.name === hostName);

  if (!hostConfig) {
    const errorMsg = `Docker host ${hostName} not found in configuration`;
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }
  return createDockerClient(hostConfig);
};

export default getDockerClient;
