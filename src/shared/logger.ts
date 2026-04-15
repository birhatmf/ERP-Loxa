import winston from 'winston';
import path from 'path';
import fs from 'fs';

const logDir = path.join(process.cwd(), 'data', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const { combine, timestamp, printf, colorize, json } = winston.format;

function summarizeValue(value: unknown): unknown {
  if (Buffer.isBuffer(value)) {
    return `[BINARY ${value.length} bytes]`;
  }

  if (value instanceof Uint8Array) {
    return `[BINARY ${value.byteLength} bytes]`;
  }

  if (Array.isArray(value)) {
    if (value.length > 20) {
      return {
        type: 'array',
        length: value.length,
        sample: value.slice(0, 10).map(item => summarizeValue(item)),
      };
    }

    return value.map(item => summarizeValue(item));
  }

  if (value && typeof value === 'object') {
    const entries: Array<[string, unknown]> = [];

    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
      entries.push([key, summarizeValue(nestedValue)]);
    }

    return Object.fromEntries(entries);
  }

  if (typeof value === 'string' && value.length > 500) {
    return `${value.slice(0, 497)}...`;
  }

  return value;
}

function summarizeMeta(meta: Record<string, unknown>): Record<string, unknown> {
  const entries: Array<[string, unknown]> = [];

  for (const [key, value] of Object.entries(meta)) {
    if (key === 'error' && value instanceof Error) {
      entries.push([key, summarizeValue(value.message)]);
      continue;
    }

    if (key === 'body' || key === 'query' || key === 'headers') {
      entries.push([key, summarizeValue(value)]);
      continue;
    }

    entries.push([key, summarizeValue(value)]);
  }

  return Object.fromEntries(entries);
}

const sanitizeInfo = winston.format((info) => {
  const sanitized: Record<string, unknown> = { ...info };

  for (const [key, value] of Object.entries(sanitized)) {
    if (key === 'message' || key === 'level' || key === 'timestamp') {
      continue;
    }

    sanitized[key] = summarizeValue(value);
  }

  return sanitized as winston.Logform.TransformableInfo;
});

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
        sanitizeInfo(),
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        consoleFormat
      ),
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'app.log'),
      level: process.env.LOG_LEVEL || 'http',
      format: combine(sanitizeInfo(), timestamp(), json()),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: combine(sanitizeInfo(), timestamp(), json()),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],
});
