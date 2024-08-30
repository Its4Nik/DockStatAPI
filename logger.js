const winston = require('winston');
const yaml = require('yamljs');
const config = yaml.load('./config/hosts.yaml');
const jsonLogging = process.env.JSON_LOGGING || 'True'

const maxlogsize = config.log.logsize || 1;
const LogAmount = config.log.LogCount || 5;


if (jsonLogging === 'True') {
    const logger = winston.createLogger({
        level: 'debug',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        ),
        transports: [
            new winston.transports.Console(),
            new winston.transports.File({
                filename: './logs/dockstat.log',
                maxsize: 1024 * 1024 * maxlogsize,
                maxFiles: LogAmount
            })
        ]
    });

    module.exports = logger;
} else if (jsonLogging === "False") {
    const logger = winston.createLogger({
        level: 'debug',
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp(),
            winston.format.printf(({ timestamp, level, message }) => `${timestamp} [ ${level} ]: ${message}`)
        ),
        transports: [
            new winston.transports.Console(),
            new winston.transports.File({
                filename: './logs/dockstat.log',
                maxsize: 1024 * 1024 * maxlogsize,
                maxFiles: LogAmount
            })
        ]
    });

    module.exports = logger;
}