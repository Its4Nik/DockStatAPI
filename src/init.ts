import express, { Request, Response, NextFunction } from "express";
import process from "node:process";
import swaggerDocs from "./utils/swaggerDocs";
import auth from "./routes/auth/routes";
import data from "./routes/data/routes";
import frontend from "./routes/frontendController/routes";
import api from "./routes/getter/routes";
import notificationService from "./routes/notifications/routes";
import conf from "./routes/setter/routes";
import graph from "./routes/graphs/routes";
import authMiddleware from "./middleware/authMiddleware";
import ha from "./routes/highavailability/routes";
import trustedProxies from "./controllers/proxy";
import { limiter } from "./middleware/rateLimiter";
import { scheduleFetch } from "./controllers/scheduler";
import { Server } from 'http';
import cors from "cors";
import { setupWebSocket } from "./utils/webSocket";
import stacks from "./routes/stack/routes";
import { blockWhileLocked } from "./middleware/checkLock";
import logger from "./utils/logger";
import initFiles from "./config/initFiles";

const LAB = [limiter, authMiddleware, blockWhileLocked];

const initializeApp = (app: express.Application, server: Server): void => {
  initFiles();

  try {
    logger.debug("Starting Websocket server, with these endpoints:");
    logger.debug("ws://localhost:9876/wss/container-data")
    logger.debug("ws://localhost:9876/wss/server-logs")
    setupWebSocket(server);
  } catch (error: unknown) {
    logger.error("Error starting WebSocket: ", error)
  }

  app.use(cors());
  app.use(express.json());

  if (process.env.NODE_ENV !== "production") {
    app.use("/api-docs", (req: Request, res: Response, next: NextFunction) =>
      next(),
    );
    app.get("/", (req: Request, res: Response) => {
      res.redirect("/api-docs");
    });
    swaggerDocs(app);
  }

  trustedProxies(app);
  scheduleFetch();

  app.use("/api", LAB, api);
  app.use("/conf", LAB, conf);
  app.use("/auth", LAB, auth);
  app.use("/data", LAB, data);
  app.use("/frontend", LAB, frontend);
  app.use("/graph", LAB, graph);
  app.use("/notification-service", LAB, notificationService);
  app.use("/stacks", LAB, stacks);
  app.use("/ha", limiter, authMiddleware, ha);

  process.on("exit", (code: number) => {
    logger.warn(`Server exiting (Code: ${code})`);
  });
};

export default initializeApp;
