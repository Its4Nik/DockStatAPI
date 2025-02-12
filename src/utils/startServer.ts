import { Express } from "express";
import { Server } from "http";
import { startMasterNode } from "../controllers/highAvailability";
import writeUserConf from "../config/hostsystem";
import initFiles from "../config/initFiles";

export function startServer(app: Express, server: Server, port: number) {
  if (process.env.NODE_ENV === "testing") {
    writeUserConf(port);
    initFiles();
  }

  server.listen(port, () => {
    startMasterNode();
  });
}
