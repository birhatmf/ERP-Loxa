"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequestLogger = createRequestLogger;
const logger_1 = require("@shared/logger");
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
    if (Array.isArray(value)) {
        return value.map(item => sanitizeValue(item));
    }
    if (value && typeof value === 'object') {
        const output = {};
        for (const [key, nestedValue] of Object.entries(value)) {
            output[key] = SENSITIVE_KEYS.has(key) ? '[REDACTED]' : sanitizeValue(nestedValue);
        }
        return output;
    }
    return value;
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
            const body = sanitizeValue(req.body);
            const metadata = {
                query,
                body,
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