import {
  RUNNING_IN_DOCKER,
  VERSION,
  HA_MASTER,
  HA_UNSAFE,
  TRUSTED_PROXIES,
  LOG_LEVEL,
} from "./variables";
import fs from "fs";
import logger from "../utils/logger";
import os from "os";
import { atomicWrite } from "../utils/atomicWrite";

const userConf = "./src/data/user.conf";
const inDocker: boolean = RUNNING_IN_DOCKER == "true";
const version: string = VERSION || "unknown";
const masterNode: string = HA_MASTER === "true" ? "✓" : "✗";
const unsafeSync: string = HA_UNSAFE === "true" ? "✓" : "✗";

let trustedProxies: string = "";

if (TRUSTED_PROXIES) {
  trustedProxies = TRUSTED_PROXIES;
} else {
  trustedProxies = "✗";
}

function writeUserConf(port: number) {
  let previousConfig = null;
  let shouldRewriteConfig = false;

  const installationDetails = {
    installedAt: new Date().toISOString(),
    backendVersion: version,
    inDocker: inDocker,
    installedBy: os.userInfo().username,
    platform: os.platform(),
    arch: os.arch(),
  };

  if (fs.existsSync(userConf)) {
    try {
      previousConfig = JSON.parse(fs.readFileSync(userConf, "utf-8"));
      if (previousConfig.backendVersion !== version) {
        shouldRewriteConfig = true;
        logger.debug(
          "Version change detected. Rewriting configuration file...",
        );
      } else {
        logger.debug("No version change detected. Skipping re-initialization.");
      }
    } catch (error) {
      logger.error(
        "Error reading the configuration file. Rewriting it...",
        error,
      );
      shouldRewriteConfig = true;
    }
  } else {
    logger.debug("Configuration file not found. Creating a new one...");
    shouldRewriteConfig = true;
  }

  if (shouldRewriteConfig) {
    atomicWrite(userConf, JSON.stringify(installationDetails, null, 2));
    logger.debug("Configuration file created/updated:", userConf);
  }

  const startDetails = {
    startedAt: new Date().toISOString(),
    backendVersion: version,
  };

  logger.info("-----------------------------------------");
  logger.info(`Starting at : ${startDetails.startedAt}`);
  logger.info(`Running env : ${process.env.NODE_ENV}`);
  logger.info(`Version     : ${startDetails.backendVersion}`);
  logger.info(`Docker      : ${installationDetails.inDocker}`);
  logger.info(`Running as  : ${installationDetails.installedBy}`);
  logger.info(`Platform    : ${installationDetails.platform}`);
  logger.info(`Arch        : ${installationDetails.arch}`);
  logger.info(`Master node : ${masterNode}`);
  logger.info(`Unsafe sync : ${unsafeSync}`);
  logger.info(`Proxies     : ${trustedProxies}`);
  logger.info(`Log Level   : ${LOG_LEVEL}`);
  logger.info(`Server      : http://localhost:${port}`);
  if (process.env.NODE_ENV !== "production") {
    logger.info(`Swagger-UI  : http://localhost:${port}/api-docs`);
  }
  logger.info("-----------------------------------------");
}

export default writeUserConf;
