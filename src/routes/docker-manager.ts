import { Elysia, t } from "elysia";
import { dockerHostManager } from "~/core/docker/host-manager";
import { dbFunctions } from "~/core/database/repository";
import { logger } from "~/core/utils/logger";

export const dockerRoutes = new Elysia({ prefix: "/docker-config" })
  .post(
    "/add-host",
    async ({ set, body }) => {
      try {
        const { id, url, pollInterval } = body;
        set.headers["Content-Type"] = "application/json";
        dbFunctions.addDockerHost(id, url, pollInterval);
        logger.debug(`Added docker host (${id})`);
        return { success: true };
      } catch (error) {
        set.status = 500;
        logger.error("Failed to add host,", error);
        return { error: "Failed to add host" };
      }
    },
    {
      body: t.Object({
        id: t.String(),
        url: t.String(),
        pollInterval: t.Number(),
      }),
    },
  )

  .get("/hosts", async ({ set }) => {
    try {
      const dockerHosts = dbFunctions.getDockerHosts();
      set.headers["Content-Type"] = "application/json";
      logger.debug("Retrieved docker hosts");
      return dockerHosts;
    } catch (error) {
      set.status = 500;
      logger.error("Failed to retrieve hosts,", error);
      return { error: "Failed to retrieve hosts" };
    }
  });
