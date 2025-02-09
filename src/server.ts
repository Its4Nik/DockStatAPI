import express from "express";
import initializeApp from "./init";
import writeUserConf from "./config/hostsystem";
import { startServer } from "./utils/startServer";
import http from "http";

const port: number = parseInt(process.env.PORT || "9876");
const app = express();
const server = http.createServer(app);

initializeApp(app, server);

if (process.env.NODE_ENV !== "testing") {
  writeUserConf(port);
  startServer(app, server, port);
}

export default app;