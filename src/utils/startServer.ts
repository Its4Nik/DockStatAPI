import { Express } from "express";
import { startMasterNode } from "../controllers/highAvailability";
import writeUserConf from "../config/hostsystem";
import initFiles from "../config/initFiles";

export function startServer(app: Express, port: number) {
  if (process.env.NODE_ENV === "testing") {
    writeUserConf(port);
    initFiles();
  }

  app.listen(port, () => {
    startMasterNode();
  });
}
