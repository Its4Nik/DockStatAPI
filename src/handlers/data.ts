import { Response, Request } from "express";
import db from "../config/db";
import { Table, DataRow } from "../typings/table";
import { createResponseHandler } from "./response";
import logger from "../utils/logger";

function formatRows(rows: DataRow[]): Record<number, string> {
  return rows.reduce(
    (
      acc: Record<number, string>,
      row,
      index: number,
    ): Record<number, string> => {
      acc[index] = JSON.parse(row.info);
      return acc;
    },
    {},
  );
}

class DatabaseHandler {
  private req: Request;
  private res: Response;

  constructor(req: Request, res: Response) {
    this.req = req;
    this.res = res;
  }

  latest() {
    const ResponseHandler = createResponseHandler(this.res);
    db.get(
      "SELECT info FROM data ORDER BY timestamp DESC LIMIT 1",
      (error: unknown, row: Partial<Pick<Table, "info">> | undefined) => {
        if (error) {
          return ResponseHandler.critical(error as string);
        }

        if (!row || !row.info) {
          return ResponseHandler.error(
            "No data available for /data/latest",
            404,
          );
        }

        try {
          return ResponseHandler.rawData(
            JSON.parse(row.info),
            "Read latest data",
          );
        } catch (error: unknown) {
          const errorMsg =
            error instanceof Error ? error.message : String(error);
          return ResponseHandler.critical(errorMsg);
        }
      },
    );
  }

  latestRaw(): Promise<unknown> {
    return new Promise((resolve, reject) => {
      logger.debug("Reading DB");
      db.get(
        "SELECT info FROM data ORDER BY timestamp DESC LIMIT 1",
        (error: unknown, row: Partial<Pick<Table, "info">> | undefined) => {
          if (error) {
            return reject(`Database query error: ${error}`);
          }

          if (!row || !row.info) {
            return reject("No data available for /data/latest");
          }

          try {
            logger.info("Read latest data");
            const parsedData = JSON.parse(row.info);
            logger.debug("Parsed data:", parsedData);
            resolve(parsedData);
          } catch (error: unknown) {
            const errorMsg =
              error instanceof Error ? error.message : String(error);
            reject(`Error parsing data: ${errorMsg}`);
          }
        },
      );
    });
  }

  all() {
    const ResponseHandler = createResponseHandler(this.res);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    db.all(
      "SELECT info FROM data WHERE timestamp >= ?",
      [oneDayAgo],
      (error: unknown, rows: Pick<Table, "info">[] | undefined) => {
        if (error) {
          return ResponseHandler.critical(error as string);
        }

        if (!rows || rows.length === 0) {
          return ResponseHandler.error("No data available", 404);
        }

        return ResponseHandler.rawData(formatRows(rows), "Read database");
      },
    );
  }

  clear() {
    const ResponseHandler = createResponseHandler(this.res);
    db.run("DELETE FROM data", (error: unknown) => {
      if (error) {
        return ResponseHandler.critical(error as string);
      }

      return ResponseHandler.ok("Database cleared successfully");
    });
  }
}

export const createDatabaseHandler = (req: Request, res: Response) =>
  new DatabaseHandler(req, res);
