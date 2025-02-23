import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { dbFunctions } from "~/core/database/repository";
import { loadPlugins } from "~/core/plugins/loader";
import { logger } from "~/core/utils/logger";
import { dockerRoutes } from "~/routes/docker-manager";
import { dockerStatsRoutes } from "~/routes/docker-stats";
import { backendLogs } from "./routes/logs";

dbFunctions.init();

const app = new Elysia()
  .use(
    swagger({
      documentation: {
        info: {
          title: "DockStatAPI",
          version: "2.1.0",
          description: "Docker monitoring API with plugin support",
        },
      },
    }),
  )
  .use(dockerRoutes)
  .use(dockerStatsRoutes)
  .use(backendLogs)
  .get("/health", () => ({ status: "healthy" }));

async function startServer() {
  try {
    await loadPlugins("./plugins");

    app.listen(3000, ({ hostname, port }) => {
      logger.info(`DockStat is running at http://${hostname}:${port}`);
      logger.info(
        `Swagger API Documentation available at http://${hostname}:${port}/swagger`,
      );
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
