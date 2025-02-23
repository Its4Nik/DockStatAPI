import { Elysia } from "elysia";
import { dbFunctions } from "~/core/database/repository";
import { logger } from "~/core/utils/logger";

export const backendLogs = new Elysia({ prefix: "/logs" })
  .get("/", async ({ set }) => {
    try {
      const logs = dbFunctions.getAllLogs();
      set.headers["Content-Type"] = "application/json";
      logger.debug(`Retrieved all logs`);
      return logs;
    } catch (error) {
      set.status = 500;
      logger.error("Failed to retrieve logs,", error);
      return { error: "Failed to retrieve logs" };
    }
  })

  .get("/:level", async ({ params: { level }, set }) => {
    try {
      const logs = dbFunctions.getLogsByLevel(level);
      set.headers["Content-Type"] = "application/json";
      logger.debug(`Retrieved logs (level: ${level})`);
      return logs;
    } catch (error) {
      set.status = 500;
      logger.error("Failed to retrieve logs");
      return { error: "Failed to retrieve logs" };
    }
  });
