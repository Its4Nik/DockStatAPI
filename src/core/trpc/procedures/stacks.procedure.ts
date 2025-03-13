import { dbFunctions } from "~/core/database/repository";
import { logger } from "~/core/utils/logger";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import {
  deployStack,
  stopStack,
  pullStackImages,
  restartStack,
  getStackStatus,
  startStack,
} from "~/core/stacks/controller";

const deployStackInput = z.object({
  compose_spec: z.any(),
  name: z.string(),
  version: z.number(),
  automatic_reboot_on_error: z.boolean(),
  isCustom: z.boolean().optional(),
  image_updates: z.boolean().optional(),
  source: z.string(),
  stack_prefix: z.string().optional(),
});

const stackOperationInput = z.object({
  stack: z.any(),
});

const stackStatusInput = z.object({
  stack_name: z.any(),
});

export const stacksProcedure = router({
  deploy: publicProcedure
    .input(deployStackInput)
    .mutation(async ({ input }) => {
      try {
        const missingParams = [];
        if (!input.compose_spec) missingParams.push("compose_spec");
        if (!input.automatic_reboot_on_error)
          missingParams.push("automatic_reboot_on_error");
        if (!input.source) missingParams.push("source");
        if (!input.name) missingParams.push("name");

        if (missingParams.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Missing values: ${missingParams.join(", ")}`,
          });
        }

        await deployStack(
          input.compose_spec,
          input.name,
          input.version,
          input.source,
          input.automatic_reboot_on_error,
          input.isCustom || false,
          input.image_updates || false,
          input.stack_prefix
        );

        logger.info(`Deployed Stack (${input.name}) via tRPC`);
        return {
          success: true,
          message: `Stack ${input.name} deployed successfully`,
        };
      } catch (error) {
        logger.error("Error deploying stack", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Error deploying stack",
          cause: error,
        });
      }
    }),

  start: publicProcedure
    .input(stackOperationInput)
    .mutation(async ({ input }) => {
      try {
        await startStack(input.stack);
        logger.info(`Started Stack (${input.stack}) via tRPC`);
        return {
          success: true,
          message: `Stack ${input.stack} started successfully`,
        };
      } catch (error) {
        logger.error("Error starting stack", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Error starting stack",
          cause: error,
        });
      }
    }),

  stop: publicProcedure
    .input(stackOperationInput)
    .mutation(async ({ input }) => {
      try {
        await stopStack(input.stack);
        logger.info(`Stopped Stack (${input.stack}) via tRPC`);
        return {
          success: true,
          message: `Stack ${input.stack} stopped successfully`,
        };
      } catch (error) {
        logger.error("Error stopping stack", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Error stopping stack",
          cause: error,
        });
      }
    }),

  restart: publicProcedure
    .input(stackOperationInput)
    .mutation(async ({ input }) => {
      try {
        await restartStack(input.stack);
        logger.info(`Restarted Stack (${input.stack}) via tRPC`);
        return {
          success: true,
          message: `Stack ${input.stack} restarted successfully`,
        };
      } catch (error) {
        logger.error("Error restarting stack", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Error restarting stack",
          cause: error,
        });
      }
    }),

  pullImages: publicProcedure
    .input(stackOperationInput)
    .mutation(async ({ input }) => {
      try {
        await pullStackImages(input.stack);
        logger.info(`Pulled Stack images (${input.stack}) via tRPC`);
        return {
          success: true,
          message: `Images for stack ${input.stack} pulled successfully`,
        };
      } catch (error) {
        logger.error("Error pulling images", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Error pulling images",
          cause: error,
        });
      }
    }),

  getStatus: publicProcedure
    .input(stackStatusInput)
    .query(async ({ input }) => {
      try {
        const status = await getStackStatus(input.stack_name);
        logger.info(`Fetched Stack status (${input.stack_name}) via tRPC`);
        return { status };
      } catch (error) {
        logger.error("Error getting stack status", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Error getting stack status",
          cause: error,
        });
      }
    }),

  getAll: publicProcedure.query(() => {
    try {
      const stacks = dbFunctions.getStacks();
      logger.info("Fetched Stacks via tRPC");
      return stacks;
    } catch (error) {
      logger.error("Error getting stacks", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          error instanceof Error ? error.message : "Error getting stacks",
        cause: error,
      });
    }
  }),
});
