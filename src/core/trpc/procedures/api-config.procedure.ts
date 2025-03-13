import { dbFunctions } from "~/core/database/repository";
import { logger } from "~/core/utils/logger";
import {
  version,
  authorEmail,
  authorName,
  authorWebsite,
  contributors,
  dependencies,
  description,
  devDependencies,
  license,
} from "~/core/utils/package-json";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { config } from "~/typings/database";

const configInputSchema = z.object({
  fetching_interval: z.number(),
  keep_data_for: z.number(),
});

export const configProcedure = router({
  get: publicProcedure.query(() => {
    try {
      const data = dbFunctions.getConfig() as config[];
      const distinct = data[0];
      logger.debug("tRPC: Fetched backend config");
      return distinct;
    } catch (error) {
      logger.error("tRPC config get error", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error getting the DockStatAPI config",
        cause: error,
      });
    }
  }),

  update: publicProcedure.input(configInputSchema).mutation(({ input }) => {
    try {
      const { fetching_interval, keep_data_for } = input;
      dbFunctions.updateConfig(fetching_interval, keep_data_for);
      return { success: true, message: "Updated DockStatAPI config" };
    } catch (error) {
      logger.error("tRPC config update error", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error updating the DockStatAPI config",
        cause: error,
      });
    }
  }),

  package: publicProcedure.query(() => {
    try {
      logger.debug("tRPC: Fetching package.json");
      return {
        version,
        description,
        license,
        authorName,
        authorEmail,
        authorWebsite,
        contributors,
        dependencies,
        devDependencies,
      };
    } catch (error) {
      logger.error("tRPC package info error", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error while reading package.json",
        cause: error,
      });
    }
  }),
});
