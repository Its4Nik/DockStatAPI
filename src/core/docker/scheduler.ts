import storeContainerData from "~/core/docker/store-container-stats";
import { dbFunctions } from "~/core/database/repository";
import { config } from "~/typings/database";
import { logger } from "~/core/utils/logger";
import storeHostData from "~/core/docker//store-host-stats";

function convertFromMinToMs(minutes: number): number {
  return minutes * 60 * 1000;
}

async function initialRun(
  scheduleName: string,
  scheduleFunction: Promise<void> | void,
  isAsync: boolean,
) {
  try {
    if (isAsync) {
      await scheduleFunction;
    } else {
      scheduleFunction;
    }
    logger.info(`Startup run success for: ${scheduleName}`);
  } catch (error) {
    logger.error(`Startup run failed for ${scheduleName}, ${error as string}`);
  }
}

async function setSchedules() {
  try {
    const rawConfigData: unknown[] = dbFunctions.getConfig();
    const configData = rawConfigData[0];

    if (
      !configData ||
      typeof (configData as config).keep_data_for !== "number" ||
      typeof (configData as config).fetching_interval !== "number"
    ) {
      logger.error("Invalid configuration data:", configData);
      throw new Error("Invalid configuration data");
    }

    const { keep_data_for, fetching_interval } = configData as config;

    if (keep_data_for === undefined) {
      const errMsg = "keep_data_for is undefined";
      logger.error(errMsg);
      throw new Error(errMsg);
    }

    if (fetching_interval === undefined) {
      const errMsg = "fetching_interval is undefined";
      logger.error(errMsg);
      throw new Error(errMsg);
    }

    logger.info(
      `Scheduling: Fetching container statistics every ${fetching_interval} minutes`,
    );

    logger.info(
      `Scheduling: Updating host statistics every ${fetching_interval} minutes`,
    );

    logger.info(
      `Scheduling: Cleaning up Database every hour and deleting data older then ${keep_data_for} days`,
    );

    // Schedule container data fetching
    await initialRun("storeContainerData", storeContainerData(), true);
    setInterval(async () => {
      try {
        logger.info("Task Start: Fetching container data.");
        await storeContainerData();
        logger.info("Task End: Container data fetched successfully.");
      } catch (error) {
        logger.error("Error in fetching container data:", error);
      }
    }, convertFromMinToMs(fetching_interval));

    // Schedule Host statistics updates
    await initialRun("storeHostData", storeHostData(), true);
    setInterval(async () => {
      try {
        logger.info("Task Start: Updating host stats.");
        await storeHostData();
        logger.info("Task End: Updating host stats successfully.");
      } catch (error) {
        logger.error("Error in updating host stats:", error);
      }
    }, convertFromMinToMs(fetching_interval));

    // Schedule database cleanup
    await initialRun(
      "dbFunctions.deleteOldData",
      dbFunctions.deleteOldData(keep_data_for),
      false,
    );
    setInterval(() => {
      try {
        logger.info("Task Start: Cleaning up old database data.");
        dbFunctions.deleteOldData(keep_data_for);
        logger.info("Task End: Database cleanup completed.");
      } catch (error) {
        logger.error("Error in database cleanup task:", error);
      }
    }, convertFromMinToMs(60));

    logger.info("Schedules have been set successfully.");
  } catch (error) {
    logger.error("Error setting schedules:", error);
    throw error;
  }
}

export { setSchedules };
