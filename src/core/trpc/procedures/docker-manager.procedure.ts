import { dbFunctions } from "~/core/database/repository";
import { logger } from "~/core/utils/logger";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, publicProcedure } from "../trpc";

const addHostInput = z.object({
  name: z.string(),
  url: z.string(),
  secure: z.boolean(),
});

const updateHostInput = z.object({
  name: z.string(),
  url: z.string(),
  secure: z.boolean(),
});

export const dockerManagerProcedure = router({
  addHost: publicProcedure.input(addHostInput).mutation(({ input }) => {
    try {
      const { name, url, secure } = input;
      dbFunctions.addDockerHost(name, url, secure);
      logger.debug(`Added docker host (${name})`);
      return { success: true, message: `Added docker host (${name})` };
    } catch (error) {
      logger.error("Error adding docker host", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error adding docker host",
        cause: error,
      });
    }
  }),

  updateHost: publicProcedure.input(updateHostInput).mutation(({ input }) => {
    try {
      const { name, url, secure } = input;
      dbFunctions.updateDockerHost(name, url, secure);
      return { success: true, message: `Updated docker host (${name})` };
    } catch (error) {
      logger.error("Error updating docker host", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update host",
        cause: error,
      });
    }
  }),

  getHosts: publicProcedure.query(() => {
    try {
      const dockerHosts = dbFunctions.getDockerHosts();
      logger.debug("Retrieved docker hosts via tRPC");
      return dockerHosts;
    } catch (error) {
      logger.error("Error retrieving docker hosts", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve hosts",
        cause: error,
      });
    }
  }),
});
