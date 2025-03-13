import { dbFunctions } from "~/core/database/repository";
import { logger } from "~/core/utils/logger";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, publicProcedure } from "../trpc";

const logLevelSchema = z.enum(["debug", "info", "warn", "error"]);

export const logsProcedure = router({
  getAll: publicProcedure.query(() => {
    try {
      const logs = dbFunctions.getAllLogs();
      logger.debug("Retrieved all logs via tRPC");
      return logs;
    } catch (error) {
      logger.error("Failed to retrieve logs", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve logs",
        cause: error,
      });
    }
  }),

  getByLevel: publicProcedure
    .input(z.object({ level: logLevelSchema }))
    .query(({ input }) => {
      try {
        const logs = dbFunctions.getLogsByLevel(input.level);
        logger.debug(`Retrieved logs (level: ${input.level}) via tRPC`);
        return logs;
      } catch (error) {
        logger.error("Failed to retrieve logs by level", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve logs by level",
          cause: error,
        });
      }
    }),

  clearAll: publicProcedure.mutation(() => {
    try {
      dbFunctions.clearAllLogs();
      logger.debug("Cleared all logs via tRPC");
      return { success: true };
    } catch (error) {
      logger.error("Failed to clear all logs", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Could not delete all logs",
        cause: error,
      });
    }
  }),

  clearByLevel: publicProcedure
    .input(z.object({ level: logLevelSchema }))
    .mutation(({ input }) => {
      try {
        dbFunctions.clearLogsByLevel(input.level);
        logger.debug(`Cleared logs (level: ${input.level}) via tRPC`);
        return { success: true };
      } catch (error) {
        logger.error("Failed to clear logs by level", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not clear logs by level",
          cause: error,
        });
      }
    }),
});
