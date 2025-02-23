import { createLogger, format, transports } from "winston";
import Transport from "winston-transport";
import path from "path";
import { dbFunctions } from "../database/repository";
import chalk, { ChalkInstance } from "chalk";

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

class SQLiteTransport extends Transport {
  constructor(opts?: Transport.TransportStreamOptions) {
    super(opts);
  }

  log(info: any, callback: () => void) {
    const { level, message, file, line } = info;
    dbFunctions.addLogEntry(level, message, file || "unknown", line || 0);
    callback();
  }
}

export const logger = createLogger({
  level: "debug",
  format: format.combine(fileLineFormat(), format.json()),
  transports: [
    new transports.Console({
      format: format.combine(
        format.printf(({ level, message, file, line }) => {
          const levelColors: { [key: string]: ChalkInstance } = {
            error: chalk.red.bold,
            warn: chalk.yellow.bold,
            info: chalk.green.bold,
            debug: chalk.blue.bold,
            verbose: chalk.cyan.bold,
            silly: chalk.magenta.bold,
          };

          const paddedLevel = level.toUpperCase();
          const coloredLevel = (levelColors[level] || chalk.white)(paddedLevel);

          const coloredContext = chalk.cyan(`${file}:${line}`);
          const coloredMessage = chalk.gray(message);

          return `${coloredLevel} [ ${coloredContext} ] - ${coloredMessage}`;
        }),
      ),
    }),
    new SQLiteTransport(),
  ],
});
