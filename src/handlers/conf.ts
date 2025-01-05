import { setFetchInterval, parseInterval } from "../controllers/scheduler";
import { Request, Response } from "express";
import fs from "fs";
import { createResponseHandler } from "./response";
import { target, dockerConfig } from "../typings/dockerConfig";
const configPath: string = "./src/data/dockerConfig.json";

class ConfHandler {
  private req: Request;
  private res: Response;

  constructor(req: Request, res: Response) {
    this.req = req;
    this.res = res;
  }

  addHost(req: Request) {
    const ResponseHandler = createResponseHandler(this.res);

    try {
      const { name, url, port } = req.query as unknown as target;
      if (!name || !url || !port) {
        return ResponseHandler.error("Name, Port, and URL are required.", 400);
      }

      const config: dockerConfig = JSON.parse(
        fs.readFileSync(configPath, "utf-8"),
      );

      if (config.hosts.some((host) => host.name === name)) {
        return ResponseHandler.error("Host already exists.", 401);
      }

      config.hosts.push({ name, url, port });
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      return ResponseHandler.ok("Host added successfully.");
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return ResponseHandler.critical(errorMsg);
    }
  }

  removeHost(req: Request) {
    const ResponseHandler = createResponseHandler(this.res);
    try {
      const hostName = req.query.hostName as string;

      if (!hostName) {
        return ResponseHandler.error("Host name is required.", 401);
      }

      const currentState = fs.readFileSync(configPath, "utf-8");
      const config: dockerConfig = JSON.parse(currentState);

      const hostIndex = config.hosts.findIndex(
        (host) => host.name === hostName,
      );

      if (hostIndex === -1) {
        return ResponseHandler.error("Host not found.", 404);
      }

      config.hosts.splice(hostIndex, 1);

      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      return ResponseHandler.ok("Host removed successfully.");
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return ResponseHandler.critical(errorMsg);
    }
  }

  scheduler(req: Request) {
    const ResponseHandler = createResponseHandler(this.res);
    try {
      const interval = req.query.interval as string;
      const newInterval = parseInterval(interval);

      if (newInterval < 5 * 60 * 1000 || newInterval > 6 * 60 * 60 * 1000) {
        return ResponseHandler.error(
          "Interval must be between 5 minutes and 6 hours.",
          401,
        );
      }

      setFetchInterval(newInterval);
      return ResponseHandler.ok("Updated interval");
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return ResponseHandler.critical(errorMsg);
    }
  }
}

export const createConfHandler = (req: Request, res: Response) =>
  new ConfHandler(req, res);
