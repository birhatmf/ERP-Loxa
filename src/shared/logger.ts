import winston from 'winston';
import path from 'path';
import fs from 'fs';

const logDir = path.join(process.cwd(), 'data', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const { combine, timestamp, printf, colorize, json } = winston.format;

function summarizeMeta(meta: Record<string, unknown>): Record<string, unknown> {
  const entries: Array<[string, unknown]> = [];

  for (const [key, value] of Object.entries(meta)) {
    if (key === 'error' && value instanceof Error) {
      entries.push([key, value.message]);
      continue;
    }

    if (key === 'body' || key === 'query' || key === 'headers') {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        entries.push([`${key}Keys`, Object.keys(value as Record<string, unknown>)]);
      } else {
        entries.push([key, value]);
      }
      continue;
    }

    if (typeof value === 'string' && value.length > 180) {
      entries.push([key, `${value.slice(0, 177)}...`]);
      continue;
    }

    entries.push([key, value]);
  }

  return Object.fromEntries(entries);
}

const consoleFormat = printf(({ level, message, timestamp, ...meta }) => {
  const safeMeta = summarizeMeta(meta);
  const metaStr = Object.keys(safeMeta).length ? ` ${JSON.stringify(safeMeta)}` : '';
  return `${timestamp} [${level}] ${message}${metaStr}`;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'http',
  levels: winston.config.npm.levels,
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        consoleFormat
      ),
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'app.log'),
      level: process.env.LOG_LEVEL || 'http',
      format: combine(timestamp(), json()),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: combine(timestamp(), json()),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],
});
