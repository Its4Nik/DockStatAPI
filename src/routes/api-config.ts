import { Elysia, t } from "elysia";
import { dbFunctions } from "~/core/database/repository";
import { logger } from "~/core/utils/logger";
import { responseHandler } from "~/core/utils/respone-handler";
import { config } from "~/typings/database";

export const apiConfigRoutes = new Elysia({ prefix: "/config" })
  .get(
    "/get",
    async ({ set }) => {
      try {
        const data = dbFunctions.getConfig() as config[];
        const distinct = data[0];
        set.status = 200;
        set.headers["Content-Type"] = "application/json";
        logger.debug("Fetched backend config");
        return distinct;
      } catch (error) {
        return responseHandler.error(
          set,
          "Error getting the DockStatAPI config",
          error as string,
        );
      }
    },
    {
      tags: ["Management"],
    },
  )
  .post(
    "/update",
    async ({ set, body }) => {
      try {
        const { polling_rate, fetching_interval, keep_data_for } = body;
        set.headers["Content-Type"] = "application/json";
        dbFunctions.updateConfig(
          polling_rate,
          fetching_interval,
          keep_data_for,
        );
        return responseHandler.ok(set, "Updated DockStatAPI config");
      } catch (error) {
        return responseHandler.error(
          set,
          "Error updating the DockStatAPI config",
          error as string,
        );
      }
    },
    {
      body: t.Object({
        polling_rate: t.Number(),
        fetching_interval: t.Number(),
        keep_data_for: t.Number(),
      }),
      tags: ["Management"],
    },
  );
