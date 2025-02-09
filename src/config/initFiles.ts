import { existsSync } from "fs";
import logger from "../utils/logger";
import { atomicWrite } from "../utils/atomicWrite";

const files = [
  { path: "./src/data/highAvailability.json", content: "{}" },
  {
    path: "./src/data/password.json",
    content: JSON.stringify(
      {
        hash: "",
        salt: "",
      },
      null,
      2,
    ),
  },
  { path: "./src/data/states.json", content: "{}" },
  {
    path: "./src/data/template.json",
    content: JSON.stringify(
      { text: "{{name}} is {{state}} on {{hostName}}" },
      null,
      2,
    ),
  },
  { path: "./src/data/frontendConfiguration.json", content: "[]" },
  { path: "./src/data/usePassword.txt", content: "false" },
];

function initFiles(): void {
  files.forEach(({ path: filePath, content }) => {
    if (!existsSync(filePath)) {
      atomicWrite(filePath, content);
      logger.info(`Created: ${filePath}`);
    } else {
      logger.debug(`Skipped (already exists): ${filePath}`);
    }
  });
}

export default initFiles;
