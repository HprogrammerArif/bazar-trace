import winston from 'winston';
import { env } from './env.js';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack }) => {
    const base = `${ts} [${level}] ${message}`;
    return stack ? `${base}\n${stack}` : base;
  }),
);

const prodFormat = combine(timestamp(), errors({ stack: true }), json());

export const logger = winston.createLogger({
  level: env.logLevel,
  format: env.isProd ? prodFormat : devFormat,
  defaultMeta: { service: 'bazar-trace-api' },
  transports: [new winston.transports.Console()],
  exitOnError: false,
});

export const httpLogStream = {
  write: (message) => logger.http(message.trim()),
};
