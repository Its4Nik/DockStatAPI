import * as fs from "fs";
import * as net from "net";
import logger from "./logger";
import { target } from "../typings/dockerConfig";
import { StatusResponse } from "../typings/response";

const filePath: string = "./src/data/dockerConfig.json";

async function checkHostStatus(hosts: target[]): Promise<StatusResponse> {
  const results: { [key: string]: boolean } = {};
  for (const host of hosts) {
    const { name, url, port } = host;

    const isOnline = await checkPort(url, port);

    results[name] = !!isOnline;

    if (results[name] == true) {
      logger.debug(`${host.url}:${port} is online`);
    } else {
      logger.debug(`${host.url}:${port} is unreachable`);
    }
  }

  return {
    ApiReachable: true,
    online: results,
  };
}

function checkPort(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(3000);

    socket.on("connect", () => {
      socket.end();
      resolve(true);
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });

    socket.on("error", () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, host);
  });
}

async function checkReachability(): Promise<StatusResponse | undefined> {
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    const parsedData = JSON.parse(data);
    const hosts: target[] = parsedData.hosts;
    return await checkHostStatus(hosts);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(errorMsg);
  }
}

export default checkReachability;
