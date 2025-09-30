import winston from 'winston';
import { config } from '../config/config';
import path from 'path';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss',
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    return log;
  })
);

// Create logger instance
export const logger = winston.createLogger({
  level: config.logLevel,
  format: logFormat,
  defaultMeta: { service: 'bookreview-api' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: config.isDevelopment ? consoleFormat : logFormat,
    }),
    
    // File transport for errors
    new winston.transports.File({
      filename: path.join(path.dirname(config.logFile), 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: config.logFile,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(path.dirname(config.logFile), 'exceptions.log'),
    }),
  ],
  
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(path.dirname(config.logFile), 'rejections.log'),
    }),
  ],
});

// Create a stream for Morgan HTTP logger
export const morganStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};
