import logger from "../utils/logger";
import fs from "fs";
import YAML from "yamljs";
import { DockerComposeFile } from "../typings/dockerCompose";
import { stackConfig } from "../typings/stackConfig";

const nameRegex = /^[A-Za-z0-9_-]+$/;
const stackRootFolder = "./stacks";
const configFilePath = `${stackRootFolder}/.config.json`;

async function getStackConfig(): Promise<string> {
  try {
    return fs.readFileSync(configFilePath, "utf-8");
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }
}

async function createStack(name: string, content: DockerComposeFile) {
  try {
    if (!name) {
      const errorMsg = "Name required";
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    if (!nameRegex.test(name)) {
      const errorMsg = "Name does not match [A-Za-z0-9]";
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    if (!content) {
      const errorMsg = "Data for this stack is required";
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    const stackFolderPath = `${stackRootFolder}/${name}`;

    if (!fs.existsSync(stackFolderPath)) {
      fs.mkdirSync(stackFolderPath, { recursive: true });
      logger.debug(`Created stack folder at ${stackFolderPath}`);
    }

    const yamlContent = YAML.stringify(content, 10, 2);

    const filePath = `${stackFolderPath}/docker-compose.yaml`;
    fs.writeFileSync(filePath, yamlContent);
    logger.debug(`Stack content written to ${filePath}`);

    updateConfigFile(name);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }
}

function updateConfigFile(stackName: string) {
  try {
    let config: stackConfig = { stacks: [] };
    if (fs.existsSync(configFilePath)) {
      const configData = fs.readFileSync(configFilePath, "utf-8");
      config = JSON.parse(configData);
    }

    const stacks = config.stacks || [];

    if (!stacks.includes(stackName)) {
      stacks.push(stackName);
    }

    const updatedConfig = { stacks };
    fs.writeFileSync(configFilePath, JSON.stringify(updatedConfig, null, 2));
    logger.debug(`Updated .config.json with stack name: ${stackName}`);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(`Error updating .config.json: ${errorMsg}`);
    throw new Error(errorMsg);
  }
}

export { createStack, getStackConfig };
