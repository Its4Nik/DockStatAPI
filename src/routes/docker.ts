import { Elysia, t } from "elysia";
import { dockerHostManager } from "../core/docker/host-manager";

export const dockerRoutes = new Elysia({ prefix: "/docker-hosts" })
  .post(
    "/",
    async ({ body }) => {
      const { id, url } = body;
      await dockerHostManager.connect(id, url);
      return { success: true };
    },
    {
      body: t.Object({
        id: t.String(),
        url: t.String(),
        pollInterval: t.Number(),
      }),
    },
  )
  .get("/", () => {
    return Array.from(dockerHostManager.connections.keys());
  });
