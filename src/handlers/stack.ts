import { Response, Request } from "express";
import {
  createStack,
  getStackConfig,
  getStackCompose,
  writeEnvFile,
  getEnvFile,
} from "../config/stacks";
import { DockerComposeFile } from "../typings/dockerCompose";
import logger from "../utils/logger";
import * as compose from "docker-compose";
import { createResponseHandler } from "./response";
import { stackConfig } from "../typings/stackConfig";
import { dockerStackEnv } from "../typings/dockerStackEnv";
import path from "path";

const PROJECT_ROOT = path.resolve(__dirname, "../..");

export async function validate(name: string): Promise<boolean> {
  const config: stackConfig = JSON.parse(await getStackConfig());
  if (!config.stacks.find((element) => element === name)) {
    throw new Error("Stack not found");
  }

  return true;
}

async function composeAction(option: string, name: string): Promise<void> {
  const composeFile: string = path.join(PROJECT_ROOT, `stacks/${name}`);
  switch (option) {
    case "start": {
      await compose.upAll({ cwd: composeFile, log: false }).then(
        () => {
          return true;
        },
        (err: unknown) => {
          throw new Error(err as string);
        },
      );
      break;
    }
    case "stop": {
      await compose.downAll({ cwd: composeFile, log: false }).then(
        () => {
          return true;
        },
        (err: unknown) => {
          throw new Error(err as string);
        },
      );
      break;
    }
  }
}

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
      let override = false;
      override = req.query.override == "true";

      await createStack(name, content, override);
      return ResponseHandler.ok("Stack created");
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(errorMsg);
      return ResponseHandler.critical(errorMsg);
    }
  }

  async start(req: Request, res: Response) {
    const ResponseHandler = createResponseHandler(res);
    try {
      const name: string = req.params.name;
      await validate(name);
      await composeAction("start", name);
      return ResponseHandler.ok("Stack started");
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(errorMsg);
      return ResponseHandler.critical(errorMsg);
    }
  }

  async stop(req: Request, res: Response) {
    const ResponseHandler = createResponseHandler(res);
    try {
      const name: string = req.params.name;
      await validate(name);
      await composeAction("stop", name);
      return ResponseHandler.ok("Stack stopped");
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(errorMsg);
      return ResponseHandler.critical(errorMsg);
    }
  }

  async stackCompose(req: Request, res: Response) {
    const ResponseHandler = createResponseHandler(res);
    try {
      const name = req.params.name;
      return ResponseHandler.rawData(
        await getStackCompose(name),
        "Stack compose fetched",
      );
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }
  }

  async setStackEnv(req: Request, res: Response) {
    const ResponseHandler = createResponseHandler(res);
    try {
      const data: dockerStackEnv = req.body;
      const name: string = req.params.name;
      if (await writeEnvFile(name, data)) {
        return ResponseHandler.ok("Wrote docker.env");
      } else {
        return ResponseHandler.critical(
          "Something went wrong while writing the env File!",
        );
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }
  }

  async getStackEnv(req: Request, res: Response) {
    const ResponseHandler = createResponseHandler(res);
    try {
      const name: string = req.params.name;
      const data = await getEnvFile(name);
      if (data == null) {
        return ResponseHandler.error(
          "No environment file found for this Stack!",
          404,
        );
      }
      return ResponseHandler.rawData(data, "Read docker.env");
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }
  }
}

export const createStackHandler = (req: Request, res: Response) =>
  new StackHandler(req, res);
