import db from "../config/db";
import fetchAllContainers from "../utils/containerService";
import logger from "../utils/logger";
import fs from "fs";
const filePath = "./src/data/states.json";

let previousState: { [key: string]: string } = {};

interface Container {
  name: string;
  id: string;
  state: string;
  hostName: string;
}

interface AllContainerData {
  [host: string]: Container[] | { error: string };
}

const fetchData = async (): Promise<void> => {
  try {
    const allContainerData: AllContainerData =
      (await fetchAllContainers()) || {};

    if (process.env.OFFLINE === "true") {
      logger.info("No new data inserted --- OFFLINE MODE");
    } else {
      db.run(
        `INSERT INTO data (info) VALUES (?)`,
        [JSON.stringify(allContainerData)],
        function (error) {
          if (error) {
            logger.error("Error inserting data:", error.message);
            return;
          }
          logger.info(`Data inserted with ID: ${this.lastID}`);
        },
      );
    }

    const containerStatus: AllContainerData = {};

    Object.keys(allContainerData).forEach((host) => {
      const containers = allContainerData[host];

      // Handle if the containers are an array, otherwise handle the error
      if (Array.isArray(containers)) {
        containerStatus[host] = containers.map((container: Container) => ({
          name: container.name,
          id: container.id,
          state: container.state,
          hostName: container.hostName,
        }));
      } else {
        // If there's an error, handle it separately
        containerStatus[host] = { error: "Error fetching containers" };
      }
    });

    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, "utf8");
      previousState = fileData ? JSON.parse(fileData) : {};
    }

    // Compare previous and current state
    if (JSON.stringify(previousState) !== JSON.stringify(containerStatus)) {
      fs.writeFileSync(filePath, JSON.stringify(containerStatus, null, 2));
      logger.info(`Container states saved to ${filePath}`);
      // TODO: Add logic + notification levels per service
    } else {
      logger.info("No state change detected, notifications not triggered.");
    }
  } catch (error: any) {
    logger.error(
      `Error fetching data: ${JSON.stringify(error)} \nStack trace: ${error.stack}`,
    );
  }
};

export default fetchData;
