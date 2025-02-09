import extractRelevantData from "../utils/extractHostData";
import { Request, Response } from "express";
import { getDockerClient } from "../utils/dockerClient";
import { fetchAllContainers } from "../utils/containerService";
import { getCurrentSchedule } from "../controllers/scheduler";
import fs from "fs";
import checkReachability from "../utils/connectionChecker";
const configPath = "./src/data/dockerConfig.json";
const userConf = "./src/data/user.conf";
import { dockerConfig } from "../typings/dockerConfig";
import { createResponseHandler } from "./response";

class ApiHandler {
  private req: Request;
  private res: Response;

  constructor(req: Request, res: Response) {
    this.req = req;
    this.res = res;
  }

  hosts() {
    const ResponseHandler = createResponseHandler(this.res);
    try {
      const rawData = fs.readFileSync(configPath, "utf-8");
      const config: dockerConfig = JSON.parse(rawData);

      if (!config.hosts) {
        return ResponseHandler.error("No hosts defined in configuration.", 400);
      }

      const hosts = config.hosts.map((host) => host.name);
      return ResponseHandler.rawData(hosts, "Fetched data for all hosts");
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return ResponseHandler.critical(errorMsg);
    }
  }

  system() {
    const ResponseHandler = createResponseHandler(this.res);
    try {
      const rawData = fs.readFileSync(userConf, "utf8");
      const config = JSON.parse(rawData);

      if (!config) {
        return ResponseHandler.error("Received empty configuration", 400);
      }

      return ResponseHandler.rawData(config, "Fetched system configuration");
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return ResponseHandler.critical(errorMsg);
    }
  }

  async hostStats(hostName: string) {
    const ResponseHandler = createResponseHandler(this.res);
    try {
      const docker = getDockerClient(hostName);
      const info = await docker.info();
      const version = await docker.version();
      const relevantData = extractRelevantData({ hostName, info, version });

      if (!relevantData) {
        ResponseHandler.error("No host found", 404);
      }

      return ResponseHandler.rawData(relevantData, "Fetched Host stats");
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return ResponseHandler.critical(errorMsg);
    }
  }

  async containers() {
    const ResponseHandler = createResponseHandler(this.res);
    try {
      const allContainerData = await fetchAllContainers();
      return ResponseHandler.rawData(
        allContainerData,
        "Fetched all containers across all hosts",
      );
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return ResponseHandler.critical(errorMsg);
    }
  }

  async config() {
    const ResponseHandler = createResponseHandler(this.res);
    try {
      const rawData = fs.readFileSync(configPath);
      const data = JSON.parse(rawData.toString());
      return ResponseHandler.rawData(data, "Fetched config");
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return ResponseHandler.critical(errorMsg);
    }
  }

  currentSchedule() {
    const ResponseHandler = createResponseHandler(this.res);
    try {
      const currentSchedule = getCurrentSchedule();
      return ResponseHandler.rawData(
        currentSchedule,
        "Fetched current schedule",
      );
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return ResponseHandler.critical(errorMsg);
    }
  }

  async status() {
    const ResponseHandler = createResponseHandler(this.res);
    try {
      const data = await checkReachability();
      return ResponseHandler.rawData(data, "Fetched Status");
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return ResponseHandler.critical(errorMsg);
    }
  }

  frontendConfig() {
    const configPath: string = "./src/data/frontendConfiguration.json";
    const ResponseHandler = createResponseHandler(this.res);
    try {
      const rawData = fs.readFileSync(configPath);
      const data = JSON.parse(rawData.toString());
      return ResponseHandler.rawData(data, "Fetched frontend configuration");
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return ResponseHandler.critical(errorMsg);
    }
  }
}

export const createApiHandler = (req: Request, res: Response) =>
  new ApiHandler(req, res);
