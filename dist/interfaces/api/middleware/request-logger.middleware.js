"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequestLogger = createRequestLogger;
const logger_1 = require("../../../shared/logger");
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
function sanitizeValue(value) {
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
        const output = {};
        for (const [key, nestedValue] of Object.entries(value)) {
            output[key] = SENSITIVE_KEYS.has(key) ? '[REDACTED]' : sanitizeValue(nestedValue);
        }
        return output;
    }
    if (typeof value === 'string' && value.length > 500) {
        return `${value.slice(0, 497)}...`;
    }
    return value;
}
function summarizeBodyForLog(body) {
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
function createRequestLogger(auditService) {
    return function requestLogger(req, res, next) {
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
                logger_1.logger.error(message, logMeta);
            }
            else if (statusCode >= 400) {
                logger_1.logger.warn(message, logMeta);
            }
            else {
                logger_1.logger.http(message, logMeta);
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
//# sourceMappingURL=request-logger.middleware.js.map