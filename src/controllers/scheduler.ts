import fetchData from "./fetchData";
import logger from "../utils/logger";
import db from "../config/db";
const regex = /(\d{1,5})([smh])/g;

let fetchInterval = 5 * 60 * 1000; // Fetch data every 5 minutes by default
const cleanupInterval = 24 * 60 * 60 * 1000; // every 24hrs
let intervalId: NodeJS.Timeout;

const scheduleFetch = () => {
  try {
    fetchData();
    cleanupOldEntries();
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(errorMsg);
  }

  intervalId = setInterval(() => {
    logger.info(
      `Fetching data at interval of ${fetchInterval / 1000} seconds.`,
    );
    fetchData();
  }, fetchInterval);

  setInterval(() => {
    cleanupOldEntries();
  }, cleanupInterval);

  logger.info(`Data fetching scheduled every ${fetchInterval / 1000} seconds.`);
  logger.info("Old entries cleanup scheduled every 24 hours.");

  // Additional 20-second interval to log process exit listeners, if any
  setInterval(() => {
    const exitListeners = process.listeners("exit");

    if (exitListeners.length > 0) {
      logger.info(`Exit listeners detected: ${exitListeners}`);
    }
  }, 20000);
};

const setFetchInterval = (newInterval: number) => {
  if (intervalId) {
    clearInterval(intervalId);
    logger.info("Cleared existing fetch interval.");
  }
  fetchInterval = newInterval;
  scheduleFetch();
  logger.info(`Fetch interval updated to ${fetchInterval / 1000} seconds.`);
};

const parseInterval = (interval: string) => {
  const timeUnits: { [key: string]: number } = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
  };

  let totalMilliseconds = 0;
  let match;

  while ((match = regex.exec(interval))) {
    const value = parseInt(match[1], 10);
    const unit = match[2];
    totalMilliseconds += value * timeUnits[unit];
  }

  return totalMilliseconds;
};

const getCurrentSchedule = () => {
  return {
    interval: fetchInterval / 1000,
  };
};

const cleanupOldEntries = async () => {
  const twentyFourHoursAgo = new Date(
    Date.now() - 24 * 60 * 60 * 1000,
  ).toISOString();
  try {
    db.run("DELETE FROM data WHERE timestamp < ?", twentyFourHoursAgo, Error);
    logger.info("Old entries cleared from the database.");
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(errorMsg);
  }
};

export { scheduleFetch, setFetchInterval, parseInterval, getCurrentSchedule };
