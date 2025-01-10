import logger from "../utils/logger";
import fs from "fs";
import chokidar from "chokidar";
import path from "path";
import { promisify } from "util";
import {
  HA_UNSAFE,
  HA_MASTER,
  HA_MASTER_IP,
  HA_NODE,
} from "../config/variables";
import { atomicWrite } from "../utils/atomicWrite";
import { HighAvailabilityConfig, HaNodeConfig, NodeCache } from "../typings/ha";

const sleep = promisify(setTimeout);

const haMasterPath: string = "./src/data/highAvailability.json";
const haNodePath: string = "./src/data/haNode.json";
const nodeCachePath: string = "./src/data/nodeCache.json";
const useUnsafeConnection: boolean = JSON.parse(HA_UNSAFE || "false");
const lockFilePath: string = "./src/data/ha.lock";

const configFiles: string[] = [
  "./src/data/dockerConfig.json",
  "./src/data/states.json",
  "./src/data/template.json",
  "./src/data/frontendConfiguration.json",
  "./src/data/nodeCache.json",
  "./src/data/usePassword.txt",
  "./src/data/password.json",
];

const MAX_RETRIES = 10;
const BASE_DELAY_MS = 100;

async function acquireLock(): Promise<void> {
  let retryCount = 0;

  while (fs.existsSync(lockFilePath)) {
    if (retryCount >= MAX_RETRIES) {
      throw new Error(
        "Failed to acquire lock: maximum retry attempts exceeded",
      );
    }

    const backoffMs = BASE_DELAY_MS * Math.pow(2, retryCount);
    const jitter = Math.random() * 0.3 * backoffMs;
    const delayMs = backoffMs + jitter;

    logger.warn(
      `Lock file exists, waiting ${Math.round(delayMs)}ms before retry ${retryCount + 1}/${MAX_RETRIES}...`,
    );
    await sleep(delayMs);
    retryCount++;
  }

  try {
    atomicWrite(lockFilePath, "locked", { exclusive: true });
    logger.debug("Lock acquired.");
  } catch (error) {
    logger.error(`Error acquiring lock: ${(error as Error).message}`);
    throw new Error("Failed to acquire lock.");
  }
}

async function releaseLock(): Promise<void> {
  try {
    if (fs.existsSync(lockFilePath)) {
      await fs.promises.unlink(lockFilePath);
      logger.debug("Lock released.");
    }
  } catch (error) {
    logger.error(`Error releasing lock: ${(error as Error).message}`);
  }
}

async function writeConfig(
  data: HighAvailabilityConfig | NodeCache | HaNodeConfig,
  filePath: string,
): Promise<void> {
  await acquireLock();
  try {
    logger.debug(`Writing ${filePath}`);
    const dirPath: string = path.dirname(filePath);
    await fs.promises.mkdir(dirPath, { recursive: true });

    const jsonData = JSON.stringify(data, null, 2);
    await fs.promises.writeFile(filePath, jsonData);

    logger.debug(`${filePath} has been written.`);
  } catch (error) {
    logger.error(`Error writing config: ${(error as Error).message}`);
  } finally {
    await releaseLock();
  }
}

async function readConfig(): Promise<HighAvailabilityConfig | null> {
  await acquireLock();
  try {
    logger.debug("Reading HA-Config");
    const data: HighAvailabilityConfig = JSON.parse(
      fs.readFileSync(haMasterPath, "utf-8"),
    );
    return data;
  } catch (error: unknown) {
    logger.error(`Error reading HA-Config: ${(error as Error).message}`);
    return null;
  } finally {
    await releaseLock();
  }
}

async function prepareFilesForSync(): Promise<Record<string, string>> {
  const fileData: Record<string, string> = {};
  try {
    for (const filePath of configFiles) {
      const content = await fs.promises.readFile(filePath, "utf-8");
      fileData[filePath] = content;
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(errorMsg);
  }
  return fileData;
}

async function checkApiReachable(node: string): Promise<boolean> {
  const nodeUrl =
    useUnsafeConnection === true
      ? `http://${node}/api/status`
      : `https://${node}/api/status`;

  logger.info(`Checking node (${nodeUrl}) reachability`);

  try {
    const response = await fetch(nodeUrl);
    if (!response.ok) {
      logger.error(`Failed to reach node ${node}. Status: ${response.status}`);
      return false;
    }

    const data = await response.json();
    if (data.ApiReachable as boolean) {
      logger.info(`Node ${node} is reachable.`);
      return true;
    } else {
      logger.error(`Node ${node} is not reachable. ApiReachable: false`);
      return false;
    }
  } catch (error) {
    logger.error(`Error reaching node ${node}: ${(error as Error).message}`);
    return false;
  }
}

async function synchronizeFilesWithNodes(): Promise<void> {
  const haConfig = await readConfig();

  if (!haConfig || !haConfig.master || haConfig.nodes.length === 0) {
    logger.warn("No slave nodes to synchronize with.");
    return;
  }

  const files = await prepareFilesForSync();

  for (const node of haConfig.nodes) {
    if (!(await checkApiReachable(node))) {
      logger.warn(
        `Skipping file sync with ${node} due to connectivity issues.`,
      );
      continue; // Skip synchronization if the node is unreachable
    }

    const nodeUrl =
      useUnsafeConnection === true
        ? `http://${node}/ha/sync`
        : `https://${node}/ha/sync`;

    logger.info(`Synchronizing files with node: ${node}`);

    const response = await fetch(nodeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files }),
    });

    if (response.ok) {
      logger.info(`Files synchronized successfully with node: ${node}`);
    } else {
      logger.error(
        `Failed to synchronize files with node ${node}. Status: ${response.status}`,
      );
    }
  }
}

function monitorConfigFiles(): void {
  const watcher = chokidar.watch(configFiles, { persistent: true });

  watcher
    .on("change", async (filePath) => {
      logger.info(`File changed: ${filePath}. Initiating synchronization.`);
      await synchronizeFilesWithNodes();
    })
    .on("error", (error) => {
      logger.error(`Error watching files: ${(error as Error).message}`);
    });

  logger.info("Started monitoring configuration files for changes.");
}

async function startMasterNode() {
  if (HA_MASTER == "true") {
    if (!HA_MASTER_IP) {
      logger.error(
        "Master's IP is not set, please set the HA_MASTER_IP variable (example: 10.0.0.4:9876)",
      );
    } else {
      const haNodeConfig: HaNodeConfig = {
        master: HA_MASTER_IP,
      };
      const haConfig: HighAvailabilityConfig = {
        active: true,
        master: true,
        nodes: HA_NODE ? HA_NODE.split(",").map((node) => node.trim()) : [],
      };

      const nodeCache: NodeCache = HA_NODE
        ? HA_NODE.split(",").reduce((cache, node, index) => {
            const [ip, port] = node.trim().split(":");
            if (ip && port) {
              cache[`node-${index + 1}`] = { ip, port: parseInt(port, 10) };
            }
            return cache;
          }, {} as NodeCache)
        : {};

      logger.debug("Writing HA-Config(s)");
      await writeConfig(haConfig, haMasterPath);
      await writeConfig(haNodeConfig, haNodePath);
      await writeConfig(nodeCache, nodeCachePath);

      logger.info("Running startup sync...");
      await synchronizeFilesWithNodes();
      logger.info("Watching config files in ./data");
      monitorConfigFiles();
    }
  } else {
    logger.info("This is a slave node");
  }
}

async function ensureFileExists(
  filePath: string,
  content: string,
): Promise<void> {
  await acquireLock();
  try {
    const dirPath = path.dirname(filePath);
    await fs.promises.mkdir(dirPath, { recursive: true });
    await fs.promises.writeFile(filePath, content, { flag: "w" });
    logger.info(`File updated: ${filePath}`);
  } catch (error) {
    logger.error(
      `Error creating/updating file ${filePath}: ${(error as Error).message}`,
    );
  } finally {
    await releaseLock();
  }
}

export {
  HighAvailabilityConfig,
  writeConfig,
  readConfig,
  prepareFilesForSync,
  synchronizeFilesWithNodes,
  monitorConfigFiles,
  startMasterNode,
  ensureFileExists,
};
