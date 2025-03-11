import { Elysia, t } from "elysia";
import { dbFunctions } from "~/core/database/repository";
import { logger } from "~/core/utils/logger";
import { responseHandler } from "~/core/utils/respone-handler";
import { config } from "~/typings/database";
import {
  version,
  authorEmail,
  authorName,
  authorWebsite,
  contributers,
  dependencies,
  description,
  devDependencies,
  license,
} from "~/core/utils/package-json";

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
  )
  .get("/package", async ({ set }) => {
    try {
      logger.debug("Fetching package.json");
      return {
              version: version,
              description: description,
              license: license,
              authorName: authorName,
              authorEmail: authorEmail,
              authorWebsite: authorWebsite,
              contributers: contributers,
              dependencies: dependencies,
              devDependencies: devDependencies,
            };

    } catch (error) {
      return responseHandler.error(
        set,
        error as string,
        "Error while reading package.json",
      );
    }
  },
    {
      tags: ["Management"],
    },
  );
