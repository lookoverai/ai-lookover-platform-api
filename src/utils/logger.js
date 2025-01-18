const winston = require("winston");

const logger = winston.createLogger({
  level: 'debug', // Allow all log levels
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.printf(({ level, message, timestamp }) => {
      return `${timestamp} ${level}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({
          all: true,
          colors: {
            debug: 'gray',
            info: 'blue',
            success: 'green', 
            warn: 'yellow',
            error: 'red',
            critical: 'red'
          }
        })
      )
    })
  ]
});

// Add custom log levels
winston.addColors({
  critical: 'red',
  success: 'green'
});

logger.levels = {
  critical: 0,
  error: 1,
  warn: 2,
  success: 3,
  info: 4,
  debug: 5
};

module.exports = logger;
