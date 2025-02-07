import express from "express";
import initializeApp from "./init";
import writeUserConf from "./config/hostsystem";
import { startServer } from "./utils/startServer";
const port: number = parseInt(process.env.PORT || "9876");

const app = express();

if (process.env.NODE_ENV !== "testing") {
  writeUserConf(port);
  startServer(app, port);
}

initializeApp(app);

export default app;
