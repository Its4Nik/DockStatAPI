import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { dbFunctions } from "~/core/database/repository";
import { loadPlugins } from "~/core/plugins/loader";
import { logger } from "~/core/utils/logger";
import { dockerRoutes } from "~/routes/docker-manager";
import { dockerStatsRoutes } from "~/routes/docker-stats";
import { backendLogs } from "~/routes/logs";
import { dockerWebsocketRoutes } from "~/routes/docker-websocket";
import { apiConfigRoutes } from "~/routes/api-config";
import { setSchedules } from "~/core/docker/scheduler";
import staticPlugin from "@elysiajs/static";

console.log("")
logger.info("Starting server...");

dbFunctions.init();

const DockStatAPI = new Elysia()
  .use(staticPlugin())
  .use(
    swagger({
      documentation: {
        info: {
          title: "DockStatAPI",
          version: "2.1.0",
          description: "Docker monitoring API with plugin support",
        },
        tags: [
          {
            name: "Statistics",
            description:
              "All endpoints for fetching statistics of hosts / containers",
          },
          {
            name: "Management",
            description: "Various endpoints for managing DockStatAPI",
          },
          {
            name: "Utils",
            description: "Various utilities which might be useful",
          },
        ],
      },
    }),
  )
  .use(dockerRoutes)
  .use(dockerStatsRoutes)
  .use(backendLogs)
  .use(dockerWebsocketRoutes)
  .use(apiConfigRoutes)
  .get("/health", () => ({ status: "healthy" }), { tags: ["Utils"] })
  .onError(({ code, set }) => {
    if (code === 'NOT_FOUND') {
      logger.warn("Unknown route, showing error page!")
      set.status = 404
      set.headers['Content-Type'] = 'text/html'
      return Bun.file('public/404.html')
    }
  });

async function startServer() {
  try {
    await loadPlugins("./src/plugins");
    DockStatAPI.listen(3000, ({ hostname, port }) => {
      console.log("")
      logger.info(`DockStatAPI is running at http://${hostname}:${port}`);
      logger.info(
        `Swagger API Documentation available at http://${hostname}:${port}/swagger`,
      );
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

await setSchedules();
await startServer();

logger.info("Started server");
console.log("")
