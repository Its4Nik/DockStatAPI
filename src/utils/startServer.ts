import { Express } from "express";
import { startMasterNode } from "../controllers/highAvailability";
import writeUserConf from "../config/hostsystem";

export function startServer(app: Express, port: number) {
  if (process.env.NODE_ENV === "testing") {
    writeUserConf(port);
  }

  app.listen(port, () => {
    startMasterNode();
  });
}
