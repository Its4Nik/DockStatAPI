import fs from "fs";
import logger from "../logger";
import { ContainerStates, Container } from "../../typings/states";

const templatePath: string = "./src/data/template.json";
const containersPath: string = "./src/data/states.json";

interface Template {
  text: string;
}

function getTemplate(): Template | null {
  try {
    const data = fs.readFileSync(templatePath, "utf8");
    return JSON.parse(data);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(errorMsg);
    return null;
  }
}

function setTemplate(newTemplate: string): void {
  try {
    fs.writeFileSync(
      templatePath,
      JSON.stringify({ text: newTemplate }, null, 2),
      "utf8",
    );
    logger.debug("Template updated successfully");
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(errorMsg);
  }
}

function renderTemplate(containerId: string): string | null {
  const template = getTemplate();
  if (!template) {
    logger.error("Template is missing or not a string");
    return null;
  }

  try {
    const data = fs.readFileSync(containersPath, "utf8");
    const containers = JSON.parse(data);

    let containerData: ContainerStates | null = null;
    for (const host in containers) {
      containerData = containers[host].find(
        (c: Container) => c.id === containerId,
      );
      if (containerData) {
        break;
      }
    }

    if (!containerData) {
      logger.error(`Container with ID ${containerId} not found`);
      return null;
    }

    // Substitute placeholders in the template with container data
    return Object.keys(containerData).reduce((text, key) => {
      const value = containerData[key as keyof ContainerStates];
      // Convert value to a string to avoid errors
      return text.replace(new RegExp(`{{${key}}}`, "g"), String(value));
    }, template.text);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(errorMsg);
    return null;
  }
}

export { getTemplate, setTemplate, renderTemplate };
