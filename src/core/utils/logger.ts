import { createLogger, format, transports } from "winston";
import path from "path";
import chalk, { ChalkInstance } from "chalk";
import { dbFunctions } from "../database/repository";

const fileLineFormat = format((info) => {
  try {
    const stack = new Error().stack?.split("\n");
    if (stack) {
      for (let i = 2; i < stack.length; i++) {
        const line = stack[i].trim();
        if (
          !line.includes("node_modules") &&
          !line.includes(path.basename(__filename))
        ) {
          const matches = line.match(/\(?(.+):(\d+):(\d+)\)?$/);
          if (matches) {
            info.file = path.basename(matches[1]);
            info.line = parseInt(matches[2]);
            break;
          }
        }
      }
    }
  } catch (err) {
    // Ignore errors in case stack trace parsing fails
  }
  return info;
});

export const logger = createLogger({
  level: "debug",
  format: format.combine(
    format.timestamp({ format: "DD/MM HH:mm:ss" }),
    fileLineFormat(),
    format.printf(({ timestamp, level, message, file, line }) => {
      const levelColors: { [key: string]: ChalkInstance } = {
        error: chalk.red.bold,
        warn: chalk.yellow.bold,
        info: chalk.green.bold,
        debug: chalk.blue.bold,
        verbose: chalk.cyan.bold,
        silly: chalk.magenta.bold,
      };

      const paddedLevel = level.toUpperCase().padEnd(5);
      const coloredLevel = (levelColors[level] || chalk.white)(paddedLevel);
      const coloredContext = chalk.cyan(`${file}:${line}`);
      const coloredMessage = chalk.gray(message);
      const coloredTimestamp = chalk.yellow(`${timestamp}`);

      try {
        dbFunctions.addLogEntry(
          level,
          message as string,
          file as string,
          line as number,
        );
      } catch (error) {
        logger.error(`Error inserting log into DB: ${error as string}`);
      }

      return `${coloredLevel} [ ${coloredTimestamp} ] - ${coloredMessage} - [ ${coloredContext} ]`;
    }),
  ),
  transports: [new transports.Console()],
});
