import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { loadPlugins } from "~/core/plugins/loader";
import { dockerRoutes } from "~/routes/docker";
import { logRoutes } from "~/routes/container-logs";
import { backendLogs } from "./routes/logs";
import { dbFunctions } from "~/core/database/repository";
import { logger } from "~/core/utils/logger";

dbFunctions.init();

const app = new Elysia()
  .use(
    swagger({
      documentation: {
        info: {
          title: "DockStatAPI",
          version: "0.1.0",
          description: "Docker monitoring API with plugin support",
        },
      },
    }),
  )
  .use(dockerRoutes)
  .use(logRoutes)
  .use(backendLogs)
  .get("/health", () => ({ status: "healthy" }));

async function startServer() {
  try {
    await loadPlugins("./plugins");

    app.listen(3000, ({ hostname, port }) => {
      logger.info(`🦊 Elysia is running at http://${hostname}:${port}`);
      logger.info(
        `📚 API Documentation available at http://${hostname}:${port}/swagger`,
      );
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
