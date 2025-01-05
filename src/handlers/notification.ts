import { Request, Response } from "express";
import fs from "fs";
import notify from "../utils/notifications/_notify";
const dataTemplate = "./src/data/template.json";
import { TemplateData } from "../typings/template";
import { createResponseHandler } from "./response";

function isTemplateData(data: TemplateData): data is TemplateData {
  return (
    data !== null && typeof data === "object" && typeof data.text === "string"
  );
}

class NotificationHandler {
  private req: Request;
  private res: Response;

  constructor(req: Request, res: Response) {
    this.req = req;
    this.res = res;
  }

  getTemplate() {
    const ResponseHandler = createResponseHandler(this.res);
    try {
      fs.readFile(dataTemplate, "utf-8", (error: unknown, data) => {
        if (error) {
          return ResponseHandler.error(error as string, 400);
        }
        return ResponseHandler.rawData(
          JSON.parse(data),
          "Fetched notification template",
        );
      });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return ResponseHandler.critical(errorMsg);
    }
  }

  setTemplate(req: Request) {
    const ResponseHandler = createResponseHandler(this.res);
    const newTemplate: TemplateData = req.body;

    try {
      if (!isTemplateData(newTemplate)) {
        return ResponseHandler.error(
          "Invalid input format. Expected JSON with a 'text' field.",
          400,
        );
      }

      fs.writeFileSync(dataTemplate, JSON.stringify(newTemplate, null, 2));
      return ResponseHandler.ok("Template updated successfully.");
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return ResponseHandler.critical(errorMsg);
    }
  }

  async test(req: Request) {
    const { type, containerId } = req.params;
    const ResponseHandler = createResponseHandler(this.res);

    try {
      await notify(type, containerId);
      return ResponseHandler.ok("Sent test notification");
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return ResponseHandler.critical(errorMsg);
    }
  }
}

export const createNotificationHandler = (req: Request, res: Response) =>
  new NotificationHandler(req, res);
