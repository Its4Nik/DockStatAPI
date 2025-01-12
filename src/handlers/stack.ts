import { Response, Request } from "express";
import createStack from "../config/stacks";
import { DockerComposeFile } from "../typings/dockerCompose";
import logger from "../utils/logger";
import { createResponseHandler } from "./response";

class StackHandler {
  private req: Request;
  private res: Response;

  constructor(req: Request, res: Response) {
    this.req = req;
    this.res = res;
  }

  async createStack(req: Request, res: Response) {
    const ResponseHandler = createResponseHandler(res);
    try {
      const name: string = req.params.name;
      const content: DockerComposeFile = req.body;

      await createStack(name, content);
      return ResponseHandler.ok("Stack created");
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(errorMsg);
      return ResponseHandler.critical(errorMsg);
    }
  }
}

export const createStackHandler = (req: Request, res: Response) =>
  new StackHandler(req, res);
