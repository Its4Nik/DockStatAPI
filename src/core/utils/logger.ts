import { createLogger, format, transports } from "winston";
import path from "path";
import chalk, { ChalkInstance } from "chalk";
import { dbFunctions } from "../database/repository";
import wrapAnsi from "wrap-ansi";

// Change to false here if dont want the spacing on a wrapped line
const padNewlines: boolean = true;

const fileLineFormat = format((info) => {
  try {
    const stack = new Error().stack?.split("\n");
    if (stack) {
      for (let i = 2; i < stack.length; i++) {
        const line = stack[i].trim();
        // Exclude lines from node_modules or the current file
        if (!line.includes("node_modules") && !line.includes(path.basename(__filename))) {
          const matches = line.match(/\(?(.+):(\d+):(\d+)\)?$/);
          if (matches) {
            info.file = path.basename(matches[1]);
            info.line = parseInt(matches[2], 10);
            break;
          }
        }
      }
    }
  } catch (err) {
    // Ignore errors during stack trace extraction
  }
  return info;
});

const formatTerminalMessage = (message: string, prefixLength: number) => {
  const maxWidth = process.stdout.columns || 80;
  const wrapWidth = maxWidth - prefixLength - 15;

  if (padNewlines) {
    const wrapped = wrapAnsi(chalk.gray(message), wrapWidth, {
      trim: true,
      hard: true,
    });

    return wrapped
      .split("\n")
      .map((line, i) => (i === 0 ? line : " ".repeat(prefixLength) + line))
      .join("\n");
  }
  return message;
};

export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  format: format.combine(
    format.timestamp({ format: "DD/MM HH:mm:ss" }),
    fileLineFormat(),
    format.printf(({ timestamp, level, message, file, line }) => {

      const levelColors: Record<string, ChalkInstance> = {
        error: chalk.red.bold,
        warn: chalk.yellow.bold,
        info: chalk.green.bold,
        debug: chalk.blue.bold,
        verbose: chalk.cyan.bold,
        silly: chalk.magenta.bold,
        task: chalk.cyan.bold
      };

      if ((message as string).startsWith("__task__")) {
        message = (message as string).replaceAll("__task__", "").trimStart();
        level = "task"
        if ((message as string).startsWith("__db__")) {
          message = (message as string).replaceAll("__db__", "").trimStart();
          message = `${chalk.magenta("DB")} ${message}`
        }
      }

      const paddedLevel = level.toUpperCase().padEnd(5);
      const coloredLevel = (levelColors[level] || chalk.white)(paddedLevel);
      const coloredContext = chalk.cyan(`${file as string}:${line as number}`);
      const coloredTimestamp = chalk.yellow(timestamp);

      if (process.env.NODE_ENV !== "dev") {
        return `${coloredLevel} [ ${coloredTimestamp} ] - ${chalk.gray(
          message
        )} - [ ${coloredContext} ]`;
      }

      const prefix = `${paddedLevel} [ ${timestamp} ] - `;
      const prefixLength = prefix.length;
      const formattedMessage = formatTerminalMessage(
        message as string,
        prefixLength
      );
      const ansiRegex = /\x1B\[[0-?9;]*[mG]/g;

      try {
        dbFunctions.addLogEntry(
          (level as string).replace(ansiRegex, ''),
          (message as string).replace(ansiRegex, ''),
          (file as string).replace(ansiRegex, ''),
          line as number
        );
      } catch (error) {
        // Use console.error to avoid recursive logging
        console.error(`Error inserting log into DB: ${String(error)}`);
        process.abort()
      }

      return `${coloredLevel} [ ${coloredTimestamp} ] - ${formattedMessage} - [ ${coloredContext} ]`;
    })
  ),
  transports: [new transports.Console()],
});
