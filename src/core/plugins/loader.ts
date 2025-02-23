import { pluginManager } from "./plugin-manager";
import path from "path";
import fs from "fs";

export async function loadPlugins(pluginDir: string) {
  const pluginPath = path.join(process.cwd(), pluginDir);

  if (!fs.existsSync(pluginPath)) {
    return;
  }

  const files = fs.readdirSync(pluginPath);

  for (const file of files) {
    if (!file.endsWith(".plugin.ts")) continue;

    const module = await import(path.join(pluginPath, file));
    const plugin = module.default;
    pluginManager.register(plugin);
  }
}
