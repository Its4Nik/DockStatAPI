import { pluginManager } from "./plugin-manager";
import path from "path";
import fs from "fs";
import { logger } from "../utils/logger";
import { checkFileForChangeMe } from "../utils/change-me-checker";

export async function loadPlugins(pluginDir: string) {
  const pluginPath = path.join(process.cwd(), pluginDir);

  logger.debug(`Loading plugins (${pluginPath})`);
  if (!fs.existsSync(pluginPath)) {
    return;
  }

  let pluginCount = 0;
  const files = fs.readdirSync(pluginPath);

  for (const file of files) {
    if (!file.endsWith(".plugin.ts")) {
      continue
    };

    const absolutePath = path.join(pluginPath, file);
    try {
      await checkFileForChangeMe(absolutePath);
      const module = await import(absolutePath);
      const plugin = module.default;
      pluginManager.register(plugin);
      pluginCount++;
    } catch (error) {
      logger.error(
        `Error while importing plugin ${absolutePath}: ${error as string}`,
      );
    }
  }

  logger.info(`Registered ${pluginCount} plugin(s)`);
}
