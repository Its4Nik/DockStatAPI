import { getDockerClient } from "../utils/dockerClient";
import logger from "../utils/logger";
import { Request, Response } from "express";
import { createResponseHandler } from "../handlers/response";

const getContainers = async (req: Request, res: Response): Promise<void> => {
  const ResponseHandler = createResponseHandler(res);
  const host: string = (req.query.host as string) || "local";

  logger.info(`Fetching containers from host: ${host}`);

  try {
    const docker = getDockerClient(host);
    const containers = await docker.listContainers();

    return ResponseHandler.rawData(
      containers,
      `Fetched containers from ${host}`,
    );
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return ResponseHandler.critical(errorMsg);
  }
};

const getContainerStats = async (
  containerID: string,
  containerHost: string,
  res: Response,
): Promise<void> => {
  logger.info(
    `Fetching stats for container: ${containerID} from host: ${containerHost}`,
  );
  const ResponseHandler = createResponseHandler(res);

  try {
    const docker = getDockerClient(containerHost);
    const container = docker.getContainer(containerID);
    const stats = await container.stats({ stream: false });

    return ResponseHandler.rawData(
      stats,
      `Successfully fetched stats for container: ${containerID} from host: ${containerHost}`,
    );
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return ResponseHandler.critical(errorMsg);
  }
};

export default {
  getContainers,
  getContainerStats,
};
