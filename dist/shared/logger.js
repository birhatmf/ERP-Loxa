"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logDir = path_1.default.join(process.cwd(), 'data', 'logs');
if (!fs_1.default.existsSync(logDir)) {
    fs_1.default.mkdirSync(logDir, { recursive: true });
}
const { combine, timestamp, printf, colorize, json } = winston_1.default.format;
function summarizeValue(value) {
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
        const entries = [];
        for (const [key, nestedValue] of Object.entries(value)) {
            entries.push([key, summarizeValue(nestedValue)]);
        }
        return Object.fromEntries(entries);
    }
    if (typeof value === 'string' && value.length > 500) {
        return `${value.slice(0, 497)}...`;
    }
    return value;
}
function summarizeMeta(meta) {
    const entries = [];
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
const sanitizeInfo = winston_1.default.format((info) => {
    const sanitized = { ...info };
    for (const [key, value] of Object.entries(sanitized)) {
        if (key === 'message' || key === 'level' || key === 'timestamp') {
            continue;
        }
        sanitized[key] = summarizeValue(value);
    }
    return sanitized;
});
const consoleFormat = printf(({ level, message, timestamp, ...meta }) => {
    const safeMeta = summarizeMeta(meta);
    const metaStr = Object.keys(safeMeta).length ? ` ${JSON.stringify(safeMeta)}` : '';
    return `${timestamp} [${level}] ${message}${metaStr}`;
});
exports.logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'http',
    levels: winston_1.default.config.npm.levels,
    transports: [
        new winston_1.default.transports.Console({
            format: combine(sanitizeInfo(), colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), consoleFormat),
        }),
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, 'app.log'),
            level: process.env.LOG_LEVEL || 'http',
            format: combine(sanitizeInfo(), timestamp(), json()),
            maxsize: 5 * 1024 * 1024,
            maxFiles: 5,
        }),
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, 'error.log'),
            level: 'error',
            format: combine(sanitizeInfo(), timestamp(), json()),
            maxsize: 5 * 1024 * 1024,
            maxFiles: 5,
        }),
    ],
});
//# sourceMappingURL=logger.js.map