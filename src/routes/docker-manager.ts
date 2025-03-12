import { Elysia, t } from "elysia";
import { dbFunctions } from "~/core/database/repository";
import { logger } from "~/core/utils/logger";
import { responseHandler } from "~/core/utils/respone-handler";

export const dockerRoutes = new Elysia({ prefix: "/docker-config" })
  .post(
    "/add-host",
    async ({ set, body }) => {
      try {
        const { name, url, secure } = body;
        set.headers["Content-Type"] = "application/json";
        dbFunctions.addDockerHost(name, url, secure);
        return responseHandler.ok(set, `Added docker host (${name})`);
      } catch (error: unknown) {
        return responseHandler.error(
          set,
          "Error adding docker Host",
          error as string,
        );
      }
    },
    {
      detail: {
        tags: ["Management"],
      },
      body: t.Object({
        name: t.String(),
        url: t.String(),
        secure: t.Boolean(),
      }),
    },
  )

  .post(
    "/update-host",
    async ({ set, body }) => {
      try {
        const { name, url, secure } = body;
        dbFunctions.updateDockerHost(name, url, secure);
      } catch (error) {
        return responseHandler.error(
          set,
          error as string,
          "Failed to update host",
        );
      }
    },
    {
      detail: {
        tags: ["Management"],
      },
      body: t.Object({
        name: t.String(),
        url: t.String(),
        secure: t.Boolean(),
      }),
    },
  )

  .get(
    "/hosts",
    async ({ set }) => {
      try {
        const dockerHosts = dbFunctions.getDockerHosts();
        set.headers["Content-Type"] = "application/json";
        logger.debug("Retrieved docker hosts");
        return dockerHosts;
      } catch (error) {
        return responseHandler.error(
          set,
          error as string,
          "Failed to retrieve hosts",
        );
      }
    },
    {
      detail: {
        tags: ["Management"],
      },
    },
  );
