import fs from "fs";
import logger from "../utils/logger";
const dataPath: string = "./src/data/frontendConfiguration.json";
const expression: string =
  "https?://(www.)?[-a-zA-Z0-9@:%._+~#=]{1,256}.[a-zA-Z0-9()]{1,6}([-a-zA-Z0-9()@:%_+.~#?&//=]*)";
const regex = new RegExp(expression);
import { FrontendConfig } from "../typings/frontendConfig";

///////////////////////////////////////////////////////////////
// Hide Containers:
async function hideContainer(containerName: string) {
  try {
    const data = await readData();
    const containerIndex = data.findIndex(
      (container) => container.name === containerName,
    );

    if (containerIndex !== -1) {
      data[containerIndex].hidden = true;
      await saveData(data);
    } else {
      data.push({ name: containerName, hidden: true });
      await saveData(data);
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(errorMsg);
  }
}

async function unhideContainer(containerName: string) {
  try {
    const data = await readData();
    const containerIndex = data.findIndex(
      (container) => container.name === containerName,
    );

    if (containerIndex !== -1) {
      delete data[containerIndex].hidden;
      await saveData(data);
      cleanupData();
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(errorMsg);
  }
}

///////////////////////////////////////////////////////////////
// Tag containers
async function addTagToContainer(containerName: string, tag: string) {
  try {
    const data = await readData();
    const containerIndex = data.findIndex(
      (container) => container.name === containerName,
    );

    if (containerIndex !== -1) {
      if (!data[containerIndex].tags) {
        data[containerIndex].tags = [];
      }
      data[containerIndex].tags.push(tag);
      await saveData(data);
    } else {
      data.push({ name: containerName, tags: [tag] });
      await saveData(data);
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(errorMsg);
  }
}

async function removeTagFromContainer(containerName: string, tag: string) {
  try {
    const data = await readData();
    const containerIndex = data.findIndex(
      (container) => container.name === containerName,
    );

    if (containerIndex !== -1 && data[containerIndex].tags) {
      data[containerIndex].tags = data[containerIndex].tags.filter(
        (t) => t !== tag,
      );
      await saveData(data);
      cleanupData();
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(errorMsg);
  }
}

///////////////////////////////////////////////////////////////
// Pin containers
async function pinContainer(containerName: string) {
  try {
    const data = await readData();
    const containerIndex = data.findIndex(
      (container) => container.name === containerName,
    );

    if (containerIndex !== -1) {
      data[containerIndex].pinned = true;
      await saveData(data);
    } else {
      data.push({ name: containerName, pinned: true });
      await saveData(data);
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(errorMsg);
  }
}

async function unpinContainer(containerName: string) {
  try {
    const data = await readData();
    const containerIndex = data.findIndex(
      (container) => container.name === containerName,
    );

    if (containerIndex !== -1) {
      delete data[containerIndex].pinned;
      await saveData(data);
      cleanupData();
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(errorMsg);
  }
}

///////////////////////////////////////////////////////////////
// Add/remove link from containers
async function setLink(containerName: string, link: string) {
  if (link.match(regex)) {
    try {
      const data = await readData();
      const containerIndex = data.findIndex(
        (container) => container.name === containerName,
      );

      if (containerIndex !== -1) {
        data[containerIndex].link = `${link}`;
        await saveData(data);
      } else {
        data.push({ name: containerName, link: `${link}` });
        await saveData(data);
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(errorMsg);
    }
  } else {
    logger.error(`Provided link is not valid: ${link}`);
    throw new Error(`Provided link is not valid: ${link}`);
  }
}

async function removeLink(containerName: string) {
  try {
    const data = await readData();
    const containerIndex = data.findIndex(
      (container) => container.name === containerName,
    );

    if (containerIndex !== -1) {
      delete data[containerIndex].link;
      await saveData(data);
      cleanupData();
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(errorMsg);
  }
}

///////////////////////////////////////////////////////////////
// Add/remove icon from containers
async function setIcon(containerName: string, icon: string, custom: boolean) {
  try {
    const data = await readData();
    const containerIndex: number = data.findIndex(
      (container) => container.name === containerName,
    );

    if (custom === true) {
      if (containerIndex !== -1) {
        data[containerIndex].icon = `custom/${icon}`;
        await saveData(data);
      } else {
        data.push({ name: containerName, icon: `custom/${icon}` });
        await saveData(data);
      }
    } else if (containerIndex !== -1) {
      data[containerIndex].icon = `${icon}`;
      await saveData(data);
    } else {
      data.push({ name: containerName, icon: `${icon}` });
      await saveData(data);
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(errorMsg);
  }
}

async function removeIcon(containerName: string) {
  try {
    const data = await readData();
    const containerIndex = data.findIndex(
      (container) => container.name === containerName,
    );

    if (containerIndex !== -1) {
      delete data[containerIndex].icon;
      await saveData(data);
      cleanupData();
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(errorMsg);
  }
}

///////////////////////////////////////////////////////////////
// Data specific functionss
async function readData() {
  try {
    const data: FrontendConfig = JSON.parse(
      await fs.promises.readFile(dataPath, "utf-8"),
    );
    return data;
  } catch (error: unknown) {
    console.error(`Error while reading ${dataPath}: ${error as Error}`);
    if (error as Error) {
      await saveData([]);
      return [];
    } else {
      throw error;
    }
  }
}

async function saveData(data: FrontendConfig) {
  try {
    await fs.promises.writeFile(
      dataPath,
      JSON.stringify(data, null, 2),
      "utf-8",
    );
    logger.info("Succesfully wrote to file");
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(errorMsg);
  }
}

async function cleanupData() {
  try {
    const data = await readData();
    let cleanedData: FrontendConfig = [];

    if (data && Array.isArray(data)) {
      cleanedData = data.filter((container) => {
        // Filter out containers with empty "tags" or containers with only one property (name)
        if (
          container.tags &&
          Array.isArray(container.tags) &&
          container.tags.length === 0
        ) {
          delete container.tags;
        }
        return Object.keys(container).length > 1;
      });
    }

    await saveData(cleanedData);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(errorMsg);
  }
}

export {
  hideContainer,
  unhideContainer,
  addTagToContainer,
  removeTagFromContainer,
  pinContainer,
  unpinContainer,
  setLink,
  removeLink,
  setIcon,
  removeIcon,
};
