import logger from "../utils/logger";
import fs from "fs";
import YAML from "yamljs";
import { DockerComposeFile } from "../typings/dockerCompose";
import { dockerStackProperty, dockerStackEnv } from "../typings/dockerStackEnv";
import { stackConfig } from "../typings/stackConfig";
import { validate } from "../handlers/stack";
import { atomicWrite } from "../utils/atomicWrite";
import { AUTOMATIC_ENVIRONMENT_FILE_MANAGEMENT } from "./variables";

const nameRegex = /^[A-Za-z0-9_-]+$/;
const stackRootFolder = "./stacks";
const configFilePath = `${stackRootFolder}/.config.json`;

async function getStackCompose(name: string) {
  try {
    await validate(name);
    const stackCompose = `${stackRootFolder}/${name}/docker-compose.yaml`;

    return YAML.parse(fs.readFileSync(stackCompose, "utf-8"));
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }
}

async function getStackConfig(): Promise<string> {
  try {
    return fs.readFileSync(configFilePath, "utf-8");
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }
}

async function createStack(
  name: string,
  content: DockerComposeFile,
  override: boolean,
) {
  try {
    if (!name) {
      const errorMsg = "Name required";
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    if (!nameRegex.test(name)) {
      const errorMsg = "Name does not match [A-Za-z0-9_-]";
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

    updateConfigFile(name);

    let yamlContent = "";
    let environmentFileData: dockerStackEnv = { environment: [] };
    if (AUTOMATIC_ENVIRONMENT_FILE_MANAGEMENT == "true" && override == false) {
      logger.debug("AEFM is activated");
      const { cleanCompose, envSchema } = extractAndRemoveEnv(content);
      yamlContent = YAML.stringify(cleanCompose, 10, 2);
      environmentFileData = envSchema;

      await writeEnvFile(name, environmentFileData);
    } else {
      yamlContent = YAML.stringify(content, 10, 2);
    }

    const filePath = `${stackFolderPath}/docker-compose.yaml`;
    atomicWrite(filePath, yamlContent);
    logger.debug(`Stack content written to ${filePath}`);
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
    atomicWrite(configFilePath, JSON.stringify(updatedConfig, null, 2));
    logger.debug(`Updated .config.json with stack name: ${stackName}`);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(`Error updating .config.json: ${errorMsg}`);
    throw new Error(errorMsg);
  }
}

async function writeEnvFile(
  name: string,
  data: dockerStackEnv,
): Promise<boolean> {
  try {
    await validate(name);

    const dockerEnvPath = `${stackRootFolder}/${name}/docker.env`;
    const dockerEnvPathBak = `${stackRootFolder}/${name}/.docker.env.bak`;

    const variableNames = data.environment.map(({ name }) => name);
    const duplicateVars = variableNames.filter(
      (item, index) => variableNames.indexOf(item) !== index,
    );

    if (duplicateVars.length > 0) {
      const duplicatesList = duplicateVars.join(", ");
      const errorMsg = `Duplicate environment variables detected: ${duplicatesList}`;
      logger.error(errorMsg);
      return false;
    }

    const envFileContent = data.environment
      .map(({ name, value }) => `${name}="${value}"`)
      .join("\n");

    if (fs.existsSync(dockerEnvPath)) {
      logger.debug("Creating a local backup");
      const previousData = fs.readFileSync(dockerEnvPath);
      atomicWrite(dockerEnvPathBak, previousData);
    }

    atomicWrite(dockerEnvPath, envFileContent);
    return true;
  } catch (error: unknown) {
    const errorMsg = (error instanceof Error ? error.message : String(error)).replace(/\n|\r/g, "");
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }
}

async function getEnvFile(name: string) {
  await validate(name);
  const dockerEnvPath = `${stackRootFolder}/${name}/docker.env`;

  if (fs.existsSync(dockerEnvPath)) {
    const data = fs.readFileSync(dockerEnvPath, "utf-8");

    const environment: dockerStackProperty[] = data
      .split("\n")
      .filter((line) => line.trim() !== "" && line.includes("="))
      .map((line) => {
        const [name, ...valueParts] = line.split("=");
        const value = valueParts.join("=").replace(/^"|"$/g, "");
        return { name: name.trim(), value: value.trim() };
      });

    return { environment };
  } else {
    return null;
  }
}

function extractAndRemoveEnv(data: DockerComposeFile): {
  cleanCompose: DockerComposeFile;
  envSchema: dockerStackEnv;
} {
  const environment: dockerStackProperty[] = [];
  const envCount: Record<string, number> = {};

  for (const [, service] of Object.entries(data.services)) {
    if (service.environment) {
      for (const key of Object.keys(service.environment)) {
        envCount[key] = (envCount[key] || 0) + 1;
      }
    }
  }

  for (const [, service] of Object.entries(data.services)) {
    if (service.environment) {
      const remainingEnvironment: Record<string, string> = {};

      for (const [key, value] of Object.entries<string>(service.environment)) {
        if (envCount[key] === 1) {
          environment.push({ name: key, value });
        } else {
          remainingEnvironment[key] = value;
        }
      }

      service.environment = remainingEnvironment;

      if (Object.keys(service.environment).length === 0) {
        delete service.environment;
      }
    }

    if (!service.env_file) {
      service.env_file = ["./docker.env"];
    }
  }

  return {
    cleanCompose: data,
    envSchema: { environment },
  };
}

export {
  createStack,
  getStackConfig,
  getStackCompose,
  writeEnvFile,
  getEnvFile,
};
