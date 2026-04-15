import { Request, Response, NextFunction } from 'express';
import { logger } from '@shared/logger';
import { AuditService } from '@shared/audit/audit.service';

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'secret',
  'apiKey',
  'xApiKey',
  'x-api-key',
  'cookie',
]);

function sanitizeValue(value: unknown): unknown {
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
        sample: value.slice(0, 10).map(item => sanitizeValue(item)),
      };
    }

    return value.map(item => sanitizeValue(item));
  }

  if (value && typeof value === 'object') {
    const output: Record<string, unknown> = {};

    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
      output[key] = SENSITIVE_KEYS.has(key) ? '[REDACTED]' : sanitizeValue(nestedValue);
    }

    return output;
  }

  if (typeof value === 'string' && value.length > 500) {
    return `${value.slice(0, 497)}...`;
  }

  return value;
}

function summarizeBodyForLog(body: unknown): { kind: string; value: unknown } {
  if (Buffer.isBuffer(body)) {
    return { kind: 'binary', value: `[BINARY ${body.length} bytes]` };
  }

  if (body instanceof Uint8Array) {
    return { kind: 'binary', value: `[BINARY ${body.byteLength} bytes]` };
  }

  if (body && typeof body === 'object' && !Array.isArray(body)) {
    return { kind: 'object', value: sanitizeValue(body) };
  }

  if (Array.isArray(body)) {
    return { kind: 'array', value: sanitizeValue(body) };
  }

  return { kind: typeof body, value: sanitizeValue(body) };
}

export function createRequestLogger(auditService: AuditService) {
  return function requestLogger(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;
      const path = req.originalUrl;
      const requestUserId = req.user?.id ?? null;
      const requestIp = req.ip ?? req.socket?.remoteAddress ?? null;
      const message = `${req.method} ${path} ${statusCode} ${duration}ms`;
      const query = sanitizeValue(req.query);
      const bodySummary = summarizeBodyForLog(req.body);
      const metadata = {
        query,
        body: bodySummary.value,
        bodyKind: bodySummary.kind,
      };
      const logMeta = {
        userId: requestUserId,
        ip: requestIp,
        duration,
        queryKeys: Object.keys(req.query ?? {}),
        bodyKeys: Object.keys(req.body ?? {}),
      };

      if (statusCode >= 500) {
        logger.error(message, logMeta);
      } else if (statusCode >= 400) {
        logger.warn(message, logMeta);
      } else {
        logger.http(message, logMeta);
      }

      void auditService.recordHttpRequest({
        userId: requestUserId,
        method: req.method,
        path,
        statusCode,
        durationMs: duration,
        ip: requestIp,
        metadata,
      });
    });

    next();
  };
}
