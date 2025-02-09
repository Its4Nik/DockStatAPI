import { createLogger, format, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { LOG_LEVEL } from "../config/variables";

const colors = {
  gray: "\x1b[90m",
  reset: "\x1b[0m",
  white: "\x1b[97m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

function colorizeLogLevel(level: string, levelName: string) {
  switch (level) {
    case "info":
      return `${colors.green}${levelName}${colors.reset}`;
    case "debug":
      return `${colors.blue}${levelName}${colors.reset}`;
    case "error":
      return `${colors.red}${levelName}${colors.reset}`;
    case "warn":
      return `${colors.yellow}${levelName}${colors.reset}`;
    default:
      return `${colors.gray}UNKNOWN${colors.reset}`;
  }
}

// Filter out Exit listeners logs
const filterLogs = format((info) => {
  if (
    typeof info.message === "string" &&
    info.message.includes("Exit listeners detected")
  ) {
    return false;
  }
  return info;
});

const logger = createLogger({
  level: LOG_LEVEL,
  format: format.combine(
    filterLogs(),
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.printf((info) => {
          const level = info.level.toUpperCase().padEnd(5, " ");
          const timestamp = `${colors.gray}${info.timestamp}${colors.reset}`;
          const levelColorized = colorizeLogLevel(
            info.level.toLowerCase(),
            level,
          );
          const message = `${colors.white}${(info.message as string).replace(/\n|\r/g, "")}${colors.reset}`;

          return `${timestamp} ${levelColorized} : ${message}`;
        }),
      ),
    }),
    new DailyRotateFile({
      filename: "logs/app-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
      zippedArchive: true,
      format: format.combine(
        format.printf((info) => {
          const level = info.level.toUpperCase().padEnd(5, " ");
          return `${info.timestamp} ${level} : ${info.message}`;
        }),
      ),
    }),
  ],
});

export default logger;
