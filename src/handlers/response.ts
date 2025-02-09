import { Response } from "express";
import logger from "../utils/logger";

class ResponseHandler {
  private res: Response;

  constructor(res: Response) {
    this.res = res;
  }

  rawData(data: unknown, message: string) {
    logger.info(message);
    this.res.status(200).json(data);
  }

  ok(message: string) {
    logger.info(message);
    this.res.status(200).json({ status: "success", message });
  }

  denied(message: string) {
    logger.warn(message);
    this.res.status(403).json({ status: "denied", message });
  }

  error(message: string, code: number) {
    logger.error(`Code: ${code} - ${message}`);
    this.res.status(code).json({ status: "error", message });
  }

  critical(log: string) {
    logger.error(log.replace(/\n|\r/g, ""));
    this.res.status(500).json({
      status: "critical",
      message: "Please see the server logs for more info",
    });
  }
}

export const createResponseHandler = (res: Response) =>
  new ResponseHandler(res);
